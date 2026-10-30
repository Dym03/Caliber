from collections import defaultdict
import io
import logging
import os
import re
import tempfile
import polars as pl
from django.db import transaction
from apps.core.management.commands.init_db import parse_df
import fastexcel
from django.core.exceptions import PermissionDenied
from django.http import Http404
from django.db.models import Q, Subquery, OuterRef, Prefetch, Count, Max
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from apps.core.models import (
    Gene,
    GeneVariant,
    PatientVariant,
    User,
    GeneticReport,
)
from apps.core.enums import ClassificationEnum
from apps.core.management.commands.init_db import (
    parse_excel_genes,
    parse_excel_dbsnp,
    parse_excel_hgvs,
    parse_patient_id,
)

logger = logging.getLogger(__name__)


def query_variants(
    variant: str,
    gene: str,
    dbsnp: str,
    page_number: int | str,
    per_page: int | str,
    patient_id: str = "",
    sort_by: str = "genomic",
    user: User | None = None,
) -> dict:
    gene_id = None
    if gene:
        gene_id = (
            Gene.objects.filter(symbol__iexact=gene)
            .values_list("id", flat=True)
            .first()
        )
        if not gene_id:
            return {
                "results": [],
                "meta": {
                    "has_next": False,
                    "total_count": 0,
                    "total_pages": 0,
                    "current_page": 1,
                },
            }

    # 1. Build patient records filters
    patient_filters = Q()
    if gene_id:
        patient_filters &= Q(variant__genes__id=gene_id)
    if dbsnp:
        patient_filters &= Q(variant__dbsnp__iexact=dbsnp)
    if variant:
        patient_filters &= (
            Q(variant__annotations__hgvs_c__iexact=variant)
            | Q(variant__annotations__hgvs_p__iexact=variant)
            | Q(variant__variation_type__iexact=variant)
            | Q(reported_hgvs_c__iexact=variant)
        )
    if patient_id:
        clean_pid = patient_id.strip()
        patient_filters &= Q(report__patient__name__iexact=clean_pid)

    # 2. Extract clinical GeneVariant IDs
    variant_ids_qs = (
        PatientVariant.objects.filter(patient_filters)
        .values_list("variant_id", flat=True)
        .distinct()
    )

    is_fallback = False
    if variant_ids_qs.exists():
        patient_prefetch = Prefetch(
            "patientvariant_set",
            queryset=PatientVariant.objects.select_related(
                "report", "report__patient", "report__created_by"
            )
            .annotate(report_variants_count=Count("report__variants"))
            .order_by("-report__updated_at", "-report__created_at", "-id"),
            to_attr="prefetched_patient_variants",
        )

        target_queryset = (
            GeneVariant.objects.filter(id__in=variant_ids_qs)
            .select_related("clinvar_entry")
            .prefetch_related("genes", "annotations", patient_prefetch)
        )

        if sort_by == "patients":
            target_queryset = target_queryset.annotate(
                num_patients=Count("patientvariant__report__patient", distinct=True)
            ).order_by("-num_patients", "chromosome", "position", "id")
        elif sort_by == "latest":
            target_queryset = target_queryset.annotate(
                max_updated=Max("patientvariant__report__updated_at")
            ).order_by("-max_updated", "chromosome", "position", "id")
        else:
            target_queryset = target_queryset.order_by("chromosome", "position", "id")

    elif not patient_id:
        # Fallback to ClinVar catalog when searching globally (not by patient) and no internal matches
        is_fallback = True
        global_filters = Q()
        if gene_id:
            global_filters &= Q(genes__id=gene_id)
        if dbsnp:
            global_filters &= Q(dbsnp__iexact=dbsnp)
        if variant:
            global_filters &= (
                Q(annotations__hgvs_c__iexact=variant)
                | Q(annotations__hgvs_p__iexact=variant)
            )

        target_queryset = (
            GeneVariant.objects.select_related("clinvar_entry")
            .prefetch_related("annotations", "genes")
            .filter(global_filters)
            .distinct()
            .order_by("chromosome", "position", "id")
        )
    else:
        target_queryset = GeneVariant.objects.none()

    # 3. Paginator
    paginator = Paginator(target_queryset, per_page)
    try:
        page_obj = paginator.page(page_number)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        return {
            "results": [],
            "meta": {
                "has_next": False,
                "has_previous": False,
                "total_count": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": 1,
                "is_fallback": is_fallback,
            },
        }

    # 4. Serialize variant-centric results with nested patient observations and history
    results = []
    clean_search_pid = patient_id.strip().lower()

    for var_obj in page_obj:
        transcripts = [
            f"{a.transcript_base or ''}.{a.transcript_version or ''}:{a.hgvs_c}".strip(
                ".:"
            )
            for a in var_obj.annotations.all()
        ]
        gene_symbols = [g.symbol for g in var_obj.genes.all()]
        gene_repr = ", ".join(gene_symbols) if gene_symbols else "Intergenic"

        clinvar_entry = getattr(var_obj, "clinvar_entry", None)
        clinvar_data = None
        if clinvar_entry:
            clinvar_data = {
                "id": clinvar_entry.clinvar_id,
                "score": clinvar_entry.clinvar_classification,
                "last_updated": (
                    clinvar_entry.last_updated.isoformat()
                    if clinvar_entry.last_updated
                    else None
                ),
            }

        if not is_fallback:
            pvs = getattr(var_obj, "prefetched_patient_variants", [])

            # Group observations by patient name to avoid duplicates and build evaluation history
            patients_map = defaultdict(list)
            for pv in pvs:
                p_name = pv.report.patient.name
                creator = pv.report.created_by
                creator_username = creator.username if creator else "System"
                report_variants_count = getattr(pv, "report_variants_count", 0)
                updated_iso = (pv.report.updated_at or pv.report.created_at).isoformat()
                can_edit = bool(
                    user
                    and user.is_authenticated
                    and (
                        user.is_staff
                        or user.is_superuser
                        or (creator and creator == user)
                    )
                )

                patients_map[p_name].append(
                    {
                        "patient_variant_id": pv.id,
                        "patient_id": p_name,
                        "category": pv.category if pv.category is not None else None,
                        "zygosity": pv.zygosity or "",
                        "comment": pv.comment or "",
                        "reported_hgvs_c": pv.reported_hgvs_c or "",
                        "report_id": pv.report.id,
                        "report_name": pv.report.report_name
                        or f"Report #{pv.report.id}",
                        "report_variants_count": report_variants_count,
                        "created_by": creator_username,
                        "updated_at": updated_iso,
                        "can_edit": can_edit,
                        "can_delete": can_edit,
                    }
                )

            unique_patients = []
            for p_name, obs_list in patients_map.items():
                latest_obs = obs_list[0]
                history = obs_list[1:] if len(obs_list) > 1 else []
                is_searched = bool(
                    clean_search_pid and clean_search_pid == p_name.strip().lower()
                )

                unique_patients.append(
                    {
                        **latest_obs,
                        "is_searched_patient": is_searched,
                        "history": history,
                        "history_count": len(history),
                    }
                )

            # Sort patients: searched patient is pinned at the top, others ordered by recent date
            if clean_search_pid:
                unique_patients.sort(
                    key=lambda p: (
                        not (p["patient_id"].strip().lower() == clean_search_pid),
                        not p["is_searched_patient"],
                        p["patient_id"],
                    )
                )
            else:
                unique_patients.sort(key=lambda p: p["updated_at"], reverse=True)

            latest_overall = pvs[0] if pvs else None
            latest_cat = (
                latest_overall.category
                if latest_overall and latest_overall.category is not None
                else None
            )
            latest_updated = (
                (
                    latest_overall.report.updated_at or latest_overall.report.created_at
                ).isoformat()
                if latest_overall
                else None
            )

            valid_cats = [
                p["category"] for p in unique_patients if p["category"] is not None
            ]
            unique_cat_set = set(valid_cats)
            has_conflicting = len(unique_cat_set) > 1
            cat_summary = (
                f"{min(unique_cat_set):g} – {max(unique_cat_set):g}"
                if has_conflicting
                else (f"{next(iter(unique_cat_set)):g}" if unique_cat_set else None)
            )

            primary_hgvs = (
                unique_patients[0]["reported_hgvs_c"]
                if unique_patients and unique_patients[0]["reported_hgvs_c"]
                else (transcripts[0] if transcripts else "")
            )

            first_patient = unique_patients[0] if unique_patients else None

            results.append(
                {
                    "source": "clinic",
                    "variant_id": var_obj.id,
                    "gene": gene_repr,
                    "all_genes": gene_symbols,
                    "variant": primary_hgvs,
                    "all_transcripts": transcripts,
                    "dbsnp": var_obj.dbsnp or "",
                    "gnomAD": var_obj.gnomAD or "",
                    "chromosome": var_obj.chromosome or "",
                    "position": var_obj.position,
                    "clinvar": clinvar_data,
                    # Variant summary fields
                    "patients_count": len(unique_patients),
                    "total_observations": len(pvs),
                    "latest_category": latest_cat,
                    "latest_updated_at": latest_updated,
                    "has_conflicting_categories": has_conflicting,
                    "categories_summary": cat_summary,
                    "patients": unique_patients,
                    # Compatibility fields for legacy consumers / tests
                    "patient_id": first_patient["patient_id"] if first_patient else "-",
                    "patient_variant_id": first_patient["patient_variant_id"]
                    if first_patient
                    else None,
                    "report_id": first_patient["report_id"] if first_patient else None,
                    "report_name": first_patient["report_name"]
                    if first_patient
                    else "",
                    "report_variants_count": first_patient["report_variants_count"]
                    if first_patient
                    else 0,
                    "category": latest_cat,
                    "updated_at": latest_updated,
                    "created_by": first_patient["created_by"]
                    if first_patient
                    else "System",
                    "comment": first_patient["comment"] if first_patient else "",
                    "can_edit": first_patient.get("can_edit", False)
                    if first_patient
                    else False,
                    "can_delete": first_patient.get("can_delete", False)
                    if first_patient
                    else False,
                }
            )
        else:
            results.append(
                {
                    "source": "clinvar_catalog",
                    "variant_id": var_obj.id,
                    "gene": gene_repr,
                    "all_genes": gene_symbols,
                    "variant": transcripts[0] if transcripts else "Unknown Transcript",
                    "all_transcripts": transcripts,
                    "dbsnp": var_obj.dbsnp or "",
                    "gnomAD": var_obj.gnomAD or "",
                    "chromosome": var_obj.chromosome or "",
                    "position": var_obj.position,
                    "clinvar": clinvar_data,
                    "patients_count": 0,
                    "total_observations": 0,
                    "latest_category": None,
                    "latest_updated_at": None,
                    "has_conflicting_categories": False,
                    "categories_summary": None,
                    "patients": [],
                    "can_edit": False,
                    "can_delete": False,
                    # Compatibility fields
                    "patient_id": "-",
                    "patient_variant_id": None,
                    "report_id": None,
                    "report_name": "",
                    "report_variants_count": 0,
                    "category": "N/A",
                    "updated_at": None,
                    "created_by": "-",
                    "comment": "Found in reference database only.",
                }
            )

    return {
        "results": results,
        "meta": {
            "current_page": page_obj.number,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
            "total_pages": paginator.num_pages,
            "total_count": paginator.count,
            "is_fallback": is_fallback,
        },
    }


def process_uploaded_variants_file(uploaded_file, user: User | None = None) -> dict:
    """
    Parses the uploaded Excel file, processes its contents, and persists the data into the database.
    Returns a dictionary containing the filename and the number of rows processed.
    """
    name = uploaded_file.name
    name_lower = name.lower()
    suffix = os.path.splitext(name_lower)[1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        for chunk in uploaded_file.chunks():
            tmp_file.write(chunk)
        tmp_path = tmp_file.name

    try:
        excel_reader = fastexcel.read_excel(tmp_path)
        sheet_names = excel_reader.sheet_names
        logger.info(f"Processing uploaded file '{name}' with sheets: {sheet_names}")
        rows_processed = 0
        for sheet in sheet_names:
            if re.match(r"^\d+-\d+.*$", sheet):  # [1-9]*-[1-9]*... pattern
                df = excel_reader.load_sheet(sheet).to_polars()
                patient_id = parse_patient_id(sheet)
                with transaction.atomic():
                    parse_df(df, name, user=user, patient_id=patient_id)
                    rows_processed += df.height
            elif (
                len(sheet_names) == 1
            ):  # If there's only one sheet, process it even if it doesn't match the pattern
                df = excel_reader.load_sheet(sheet).to_polars()
                with transaction.atomic():
                    parse_df(df, name, user=user)
                    rows_processed += df.height

        return {"filename": name, "rows": rows_processed}
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def format_classification(clinic_val, clinvar_val) -> tuple[str, str]:
    c_str = ClassificationEnum._CLASSIFICATION_SCORE_TO_STRING.get(clinic_val)
    cv_str = ClassificationEnum._CLASSIFICATION_SCORE_TO_STRING.get(clinvar_val)

    if c_str and cv_str:
        if c_str == cv_str:
            return c_str, "Shoda (Klinika i ClinVar)"
        else:
            return (
                f"Klinika: {c_str} / ClinVar: {cv_str}",
                "Diskrepance (Neshoda hodnocení)",
            )
    elif c_str:
        return c_str, "Pouze v interní klinické DB"
    elif cv_str:
        return cv_str, "Pouze v ClinVar katalogu"
    return "—", "Nenalezeno žádné hodnocení"


def resolve_matches(matches: list[dict], format_classification_fn) -> dict:
    """Sloučí více nalezených variant se stejným klíčem dohromady.

    Pokud jedna nese klinické hodnocení a druhá ClinVar, spojí je do jednoho
    výstupu.
    """
    if not matches:
        return {
            "Zhodnoceni_Patogenity": "Neklasifikováno",
            "ClinVar_ID": "—",
            "Status_Kontroly": "Nenalezeno v DB",
        }

    clinic_scores = [
        m["clinic_score"] for m in matches if m["clinic_score"] is not None
    ]
    clinvar_scores = [
        m["clinvar_score"] for m in matches if m["clinvar_score"] is not None
    ]
    clinvar_ids = [
        str(m["clinvar_id"])
        for m in matches
        if m["clinvar_id"] and m["clinvar_id"] != "—"
    ]

    best_clinic = clinic_scores[0] if clinic_scores else None
    best_clinvar = clinvar_scores[0] if clinvar_scores else None
    merged_clinvar_id = ", ".join(dict.fromkeys(clinvar_ids)) if clinvar_ids else "—"

    final_score, match_status = format_classification_fn(best_clinic, best_clinvar)

    return {
        "Zhodnoceni_Patogenity": final_score or "Neklasifikováno",
        "ClinVar_ID": merged_clinvar_id,
        "Status_Kontroly": match_status,
    }


def get_variant_hashes_from_db(
    unique_dbsnps: list[str], unique_variants: list[str]
) -> tuple[dict, dict]:
    """
    Queries the database for GeneVariant entries matching the provided dbSNP IDs and HGVS notations, and constructs two hash maps:
    1. dbsnp_map: Maps cleaned dbSNP IDs to their classification and ClinVar ID.
    2. hgvs_map: Maps cleaned HGVS notations (with and without gene symbol) to their classification and ClinVar ID.
    """
    dbsnp_map = defaultdict(list)
    hgvs_map = defaultdict(list)

    db_filters = Q()
    if unique_dbsnps:
        db_filters |= Q(dbsnp__in=unique_dbsnps)
    if unique_variants:
        db_filters |= Q(annotations__hgvs_c__in=unique_variants)

    if db_filters:
        latest_clinic_category = Subquery(
            PatientVariant.objects.filter(
                variant=OuterRef("pk"), category__isnull=False
            )
            .order_by("-report__updated_at")
            .values("category")[:1]
        )

        matched_variants = (
            GeneVariant.objects.select_related("clinvar_entry")
            .prefetch_related("annotations", "genes")
            .annotate(latest_clinic_cat=latest_clinic_category)
            .filter(db_filters)
            .distinct()
        )

        for gv in matched_variants:
            clinvar_score = (
                gv.clinvar_entry.clinvar_classification
                if hasattr(gv, "clinvar_entry")
                else None
            )
            clinvar_id = (
                gv.clinvar_entry.clinvar_id if hasattr(gv, "clinvar_entry") else "—"
            )
            clinic_score = gv.latest_clinic_cat

            variant_data = {
                "variant_id": gv.pk,
                "clinic_score": clinic_score,
                "clinvar_score": clinvar_score,
                "clinvar_id": clinvar_id,
            }

            if gv.dbsnp:
                dbsnp_key = gv.dbsnp.strip().lower()
                if not any(
                    item["variant_id"] == gv.pk for item in dbsnp_map[dbsnp_key]
                ):
                    dbsnp_map[dbsnp_key].append(variant_data)

            variant_genes = [g.symbol.strip().lower() for g in gv.genes.all()]

            for ann in gv.annotations.all():
                if ann.hgvs_c:
                    c_clean = ann.hgvs_c.strip()
                    # Záložní klíč bez genu pro případ prázdného variant_genes
                    if not any(
                        item["variant_id"] == gv.pk for item in hgvs_map[c_clean]
                    ):
                        hgvs_map[c_clean].append(variant_data)
                    for g_sym in variant_genes:
                        pair_key = (g_sym, c_clean)
                        if not any(
                            item["variant_id"] == gv.pk for item in hgvs_map[pair_key]
                        ):
                            hgvs_map[pair_key].append(variant_data)

    return dict(dbsnp_map), dict(hgvs_map)


def annotate_excel_workbook(
    file_bytes: bytes, dbsnp_map: dict, hgvs_map: dict
) -> io.BytesIO:
    """
    Loads the uploaded Excel file, iterates through its rows, and annotates each variant based on dbSNP ID or HGVS notation using the provided hash maps.
    Adds three new columns for classification, ClinVar ID, and match status. Returns a Bytes
    """
    import xlsxwriter

    excel_reader = fastexcel.read_excel(file_bytes)
    sheet_names = excel_reader.sheet_names
    annotated_sheets = {}

    def annotate_row(gene_val, variant_val, dbsnp_val) -> dict:
        g_clean = parse_excel_genes(gene_val) if gene_val else []
        d_clean = parse_excel_dbsnp(str(dbsnp_val)) if dbsnp_val is not None else ""

        hgvs = ""
        if variant_val is not None:
            parsed = parse_excel_hgvs(str(variant_val))
            if parsed and len(parsed) >= 3:
                hgvs = parsed[2]

        collected_matches = []
        seen_ids = set()

        def add_matches(items: list[dict]):
            for item in items:
                v_id = item.get("variant_id")
                if v_id not in seen_ids:
                    seen_ids.add(v_id)
                    collected_matches.append(item)

        # 1. Shoda podle dbSNP
        if d_clean and d_clean in dbsnp_map:
            add_matches(dbsnp_map[d_clean])

        # 2. Shoda podle (gene, hgvs)
        if g_clean and hgvs:
            for g in g_clean:
                pair = (g.strip().lower(), hgvs)
                if pair in hgvs_map:
                    add_matches(hgvs_map[pair])

        # 3. Shoda podle samotného HGVS (pokud nic předchozího nenašlo shodu)
        if not collected_matches and hgvs and hgvs in hgvs_map:
            add_matches(hgvs_map[hgvs])

        # Sloučení všech nalezených záznamů a formátování výsledku
        return resolve_matches(collected_matches, format_classification)

    num_sheets = len(sheet_names)

    for sheet in sheet_names:
        if (
            re.match(r"^\d+-\d+.*$", sheet) or num_sheets == 1
        ):  # [1-9]*-[1-9]*... pattern
            df = excel_reader.load_sheet(sheet).to_polars()
            orig_headers = df.columns
            logger.debug(f"Processing sheet '{sheet}' with headers: {orig_headers}")
            gene_col = variant_col = dbsnp_col = None
            for idx, col in enumerate(orig_headers, start=1):
                if not col:
                    continue
                low = str(col).strip().lower()
                if low in ["symbol", "gene"]:
                    gene_col = col
                elif low in ["nucleotide", "hgvsc"]:
                    variant_col = col
                elif low in ["vep dbsnp id", "dbsnp"]:
                    dbsnp_col = col

            if any(
                [gene_col, variant_col, dbsnp_col]
            ):  # If none of the required columns are found, keep the sheet unmodified
                annotations = [
                    annotate_row(
                        row.get(gene_col) if gene_col else None,
                        row.get(variant_col) if variant_col else None,
                        row.get(dbsnp_col) if dbsnp_col else None,
                    )
                    for row in df.iter_rows(named=True)
                ]

                # Convert annotations to Polars DataFrame and append columns
                ann_df = pl.DataFrame(
                    annotations,
                    schema={
                        "Zhodnoceni_Patogenity": pl.Utf8,
                        "ClinVar_ID": pl.Utf8,
                        "Status_Kontroly": pl.Utf8,
                    },
                )

                df = df.with_columns(
                    ann_df["Zhodnoceni_Patogenity"],
                    ann_df["ClinVar_ID"],
                    ann_df["Status_Kontroly"],
                )

                annotated_sheets[sheet] = df

    output = io.BytesIO()
    with xlsxwriter.Workbook(output, {"in_memory": True}) as workbook:
        for sheet_title, sheet_df in annotated_sheets.items():
            safe_title = sheet_title[:31]  # Excel sheet title limit

            sheet_df.write_excel(
                workbook=workbook,
                worksheet=safe_title,
                autofit=True,
            )

    output.seek(0)
    return output


def get_dashboard_statistics() -> dict:
    """
    Computes aggregated statistical telemetry for the database dashboard:
    - Overview KPIs (patients, reports, variants, ClinVar reference)
    - Pathogenicity classification breakdown (ACMG 1-5 categories)
    - Zygosity distribution
    - Top mutated genes across the cohort
    - High-frequency recurrent variants
    - Recent diagnostic report uploads
    """
    from django.db.models import Count, Max
    from apps.core.models import (
        Patient,
        GeneticReport,
        PatientVariant,
        GeneVariant,
        TranscriptAnnotation,
    )
    from apps.clinvar.models import ClinVarGeneVariant

    total_patients = Patient.objects.count()
    total_reports = GeneticReport.objects.count()
    total_patient_variants = PatientVariant.objects.count()
    total_unique_variants = (
        PatientVariant.objects.values("variant_id").distinct().count()
    )
    pathogenic_patients = (
        PatientVariant.objects.filter(
            category__gte=4.0, category__lte=5.0
        )  # Categories 4 and 5 are considered pathogenic
        .values("report__patient_id")
        .distinct()
        .count()
    )
    total_clinvar = ClinVarGeneVariant.objects.count()
    clinvar_last_updated = (
        ClinVarGeneVariant.objects.order_by("-last_updated")
        .values_list("last_updated", flat=True)
        .first()
    )

    pathogenic_pct = (
        round((pathogenic_patients / total_patients) * 100, 1)
        if total_patients > 0
        else 0.0
    )

    # 1. Classification Categories Breakdown
    cat_counts_raw = (
        PatientVariant.objects.values("category")
        .annotate(count=Count("id"))
        .order_by("-category")
    )

    category_meta = {
        8.0: {"label": "Somatická varianta", "class": "c8"},
        7.0: {"label": "Farmakogenetický rizikový faktor", "class": "c7"},
        6.0: {"label": "Hypomorfní varianta", "class": "c6"},
        5.0: {"label": "Třída 5 – Patogenní", "class": "c5"},
        4.5: {
            "label": "Třída 4-5 – Patogenní / Pravděpodobně patogenní",
            "class": "c4-5",
        },
        4.0: {"label": "Třída 4 – Pravděpodobně patogenní", "class": "c4"},
        3.5: {
            "label": "Třída 3-4 – VUS / Pravděpodobně patogenní",
            "class": "c3-4",
        },
        3.0: {"label": "Třída 3 – VUS (Nejasný význam)", "class": "c3"},
        2.5: {
            "label": "Třída 2-3 – Pravděpodobně benigní / VUS",
            "class": "c2-3",
        },
        2.0: {"label": "Třída 2 – Pravděpodobně benigní", "class": "c2"},
        1.5: {
            "label": "Třída 1-2 – Benigní / Pravděpodobně benigní",
            "class": "c1-2",
        },
        1.0: {"label": "Třída 1 – Benigní", "class": "c1"},
        0.0: {"label": "Artefakt / Jiné", "class": "c0"},
        -1.0: {"label": "Neklasifikováno", "class": "c-1"},
    }

    categories_breakdown = []
    for item in cat_counts_raw:
        cat_val = item["category"]
        count = item["count"]
        pct = (
            round((count / total_patient_variants) * 100, 1)
            if total_patient_variants > 0
            else 0.0
        )
        meta = category_meta.get(
            cat_val,
            {
                "label": f"Kategorie {cat_val}" if cat_val is not None else "Neuvedeno",
                "class": "c0",
            },
        )
        categories_breakdown.append(
            {
                "category": cat_val,
                "label": meta["label"],
                "color_class": meta["class"],
                "count": count,
                "percentage": pct,
            }
        )

    # 2. Zygosity Breakdown
    zyg_counts_raw = (
        PatientVariant.objects.values("zygosity")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    normalized_zygosities = {}
    for item in zyg_counts_raw:
        raw_zyg = (item["zygosity"] or "").strip().upper()
        if "HET" in raw_zyg:
            norm_label = "Heterozygot (HET)"
        elif "HOM" in raw_zyg:
            norm_label = "Homozygot (HOM)"
        elif "HEM" in raw_zyg:
            norm_label = "Hemizygot (HEM)"
        else:
            norm_label = "Neurčeno / Jiné"
        normalized_zygosities[norm_label] = (
            normalized_zygosities.get(norm_label, 0) + item["count"]
        )

    zygosities_breakdown = []
    for label, count in normalized_zygosities.items():
        pct = (
            round((count / total_patient_variants) * 100, 1)
            if total_patient_variants > 0
            else 0.0
        )
        zygosities_breakdown.append({"label": label, "count": count, "percentage": pct})
    zygosities_breakdown.sort(key=lambda x: x["count"], reverse=True)

    # 3. Top mutated genes
    top_genes_raw = list(
        PatientVariant.objects.filter(variant__genes__isnull=False)
        .values("variant__genes__symbol")
        .annotate(
            patient_count=Count("report__patient_id", distinct=True),
            variant_count=Count("id"),
        )
        .order_by("-patient_count", "-variant_count")[:10]
    )
    top_genes = []
    for g in top_genes_raw:
        symbol = g["variant__genes__symbol"]
        p_count = g["patient_count"]
        v_count = g["variant_count"]
        pct = round((p_count / total_patients) * 100, 1) if total_patients > 0 else 0.0
        top_genes.append(
            {
                "symbol": symbol,
                "patient_count": p_count,
                "variant_count": v_count,
                "percentage": pct,
            }
        )

    # 4. Most recurrent variants in cohort
    recurrent_raw = list(
        PatientVariant.objects.values(
            "variant_id",
            "variant__chromosome",
            "variant__position",
            "variant__dbsnp",
            "variant__variation_type",
            "variant__clinvar_entry__clinvar_id",
            "variant__clinvar_entry__clinvar_classification",
        )
        .annotate(
            patient_count=Count("report__patient_id", distinct=True),
            observation_count=Count("id"),
            max_category=Max("category"),
        )
        .order_by("-patient_count", "-observation_count")[:10]
    )

    recurrent_var_ids = [r["variant_id"] for r in recurrent_raw]
    genes_by_var = {}
    if recurrent_var_ids:
        for gv in GeneVariant.objects.filter(id__in=recurrent_var_ids).prefetch_related(
            "genes"
        ):
            genes_by_var[gv.id] = [g.symbol for g in gv.genes.all()]

    hgvs_by_var = {}
    if recurrent_var_ids:
        for ta in (
            TranscriptAnnotation.objects.filter(variant_id__in=recurrent_var_ids)
            .exclude(hgvs_c__isnull=True)
            .exclude(hgvs_c="")
        ):
            if ta.variant_id not in hgvs_by_var:
                hgvs_by_var[ta.variant_id] = ta.hgvs_c

    recurrent_variants = []
    for r in recurrent_raw:
        v_id = r["variant_id"]
        gene_list = genes_by_var.get(v_id, [])
        primary_gene = gene_list[0] if gene_list else "—"
        hgvs_c = hgvs_by_var.get(v_id, "")
        recurrent_variants.append(
            {
                "variant_id": v_id,
                "gene": primary_gene,
                "hgvs_c": hgvs_c,
                "dbsnp": r["variant__dbsnp"] or "—",
                "chromosome": r["variant__chromosome"],
                "position": r["variant__position"],
                "variation_type": r["variant__variation_type"] or "SNV",
                "patient_count": r["patient_count"],
                "observation_count": r["observation_count"],
                "category": r["max_category"],
                "clinvar_id": r["variant__clinvar_entry__clinvar_id"],
                "clinvar_classification": r[
                    "variant__clinvar_entry__clinvar_classification"
                ],
            }
        )

    # 5. Recent Reports
    recent_reports_raw = list(
        GeneticReport.objects.select_related("patient", "created_by")
        .annotate(variants_count=Count("variants"))
        .order_by("-created_at")[:6]
    )
    recent_reports = [
        {
            "id": rep.id,
            "report_name": rep.report_name or "Report bez názvu",
            "patient_name": rep.patient.name,
            "created_at": rep.created_at.strftime("%d.%m.%Y %H:%M"),
            "created_by": rep.created_by.username if rep.created_by else "Systém",
            "variants_count": rep.variants_count,
        }
        for rep in recent_reports_raw
    ]

    return {
        "summary": {
            "total_patients": total_patients,
            "total_reports": total_reports,
            "total_patient_variants": total_patient_variants,
            "total_unique_variants": total_unique_variants,
            "pathogenic_patients": pathogenic_patients,
            "pathogenic_patients_percentage": pathogenic_pct,
            "total_clinvar_variants": total_clinvar,
            "clinvar_last_updated": (
                clinvar_last_updated.strftime("%d.%m.%Y")
                if clinvar_last_updated
                else "Neznámé"
            ),
        },
        "categories_breakdown": categories_breakdown,
        "zygosities_breakdown": zygosities_breakdown,
        "top_genes": top_genes,
        "recurrent_variants": recurrent_variants,
        "recent_reports": recent_reports,
    }


def delete_patient_variant(patient_variant_id: int, user: User) -> dict:
    """
    Deletes a single PatientVariant record.
    Enforces authorization: user must be staff/superuser or the creator of the report.
    If this was the last variant in the report, deletes the report as well.
    If the patient has no other reports, deletes the patient.
    """
    try:
        pv = PatientVariant.objects.select_related(
            "report", "report__patient", "report__created_by"
        ).get(pk=patient_variant_id)
    except PatientVariant.DoesNotExist:
        raise Http404("Varianta pacienta nebyla nalezena.")

    report = pv.report
    if not (
        user.is_staff
        or user.is_superuser
        or (report.created_by and report.created_by == user)
    ):
        raise PermissionDenied("Nemáte oprávnění smazat tuto variantu.")

    patient = report.patient
    with transaction.atomic():
        is_last_in_report = report.variants.count() <= 1
        pv.delete()

        report_deleted = False
        if is_last_in_report:
            report.delete()
            report_deleted = True
            if patient.reports.count() == 0:
                patient.delete()

    return {
        "success": True,
        "message": "Varianta byla úspěšně smazána."
        + (" Report byl prázdný a byl také odstraněn." if report_deleted else ""),
        "report_deleted": report_deleted,
    }


def update_patient_variant(
    patient_variant_id: int,
    user: User,
    category: float | int | str | None = None,
    comment: str | None = None,
) -> dict:
    """
    Updates the evaluation category and/or comment of a single PatientVariant record.
    Enforces authorization: user must be staff/superuser or the creator of the report.
    """
    try:
        pv = PatientVariant.objects.select_related(
            "report", "report__patient", "report__created_by"
        ).get(pk=patient_variant_id)
    except PatientVariant.DoesNotExist:
        raise Http404("Varianta pacienta nebyla nalezena.")

    report = pv.report
    if not (
        user.is_staff
        or user.is_superuser
        or (report.created_by and report.created_by == user)
    ):
        raise PermissionDenied("Nemáte oprávnění upravit hodnocení této varianty.")

    # Update category if provided
    if category is not None and category != "":
        try:
            cat_float = float(category)
        except (ValueError, TypeError):
            raise ValueError(f"Neplatná hodnota kategorie: {category}")
        pv.category = cat_float
    elif category == "":
        pv.category = None

    if comment is not None:
        pv.comment = str(comment).strip()

    with transaction.atomic():
        pv.save()
        report.save(update_fields=["updated_at"])

    return {
        "success": True,
        "message": "Hodnocení bylo úspěšně aktualizováno.",
        "patient_variant_id": pv.id,
        "category": pv.category,
        "comment": pv.comment,
        "updated_at": report.updated_at.isoformat(),
    }


def delete_genetic_report(report_id: int, user: User) -> dict:
    """
    Deletes an entire GeneticReport and all associated PatientVariant records.
    Enforces authorization: user must be staff/superuser or the creator of the report.
    If the patient has no other reports, deletes the patient.
    """
    try:
        report = GeneticReport.objects.select_related("patient", "created_by").get(
            pk=report_id
        )
    except GeneticReport.DoesNotExist:
        raise Http404("Genetický report nebyl nalezen.")

    if not (
        user.is_staff
        or user.is_superuser
        or (report.created_by and report.created_by == user)
    ):
        raise PermissionDenied("Nemáte oprávnění smazat tento report.")

    patient = report.patient
    report_name = report.report_name or f"Report #{report.id}"
    variants_count = report.variants.count()

    with transaction.atomic():
        report.delete()
        patient_deleted = False
        if patient.reports.count() == 0:
            patient.delete()
            patient_deleted = True

    return {
        "success": True,
        "message": f"Report '{report_name}' a všech jeho {variants_count} variant bylo úspěšně smazáno.",
        "deleted_variants_count": variants_count,
        "patient_deleted": patient_deleted,
    }


def extract_theme_colors(wb) -> list[str]:
    """Extract base RGB theme colors from workbook loaded_theme XML."""
    import xml.etree.ElementTree as ET

    if not hasattr(wb, "loaded_theme") or not wb.loaded_theme:
        return []
    try:
        root = ET.fromstring(wb.loaded_theme)
        ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
        clr_scheme = root.find(".//a:clrScheme", ns)
        if clr_scheme is None:
            return []
        colors = []
        for child in clr_scheme:
            srgb = child.find(".//a:srgbClr", ns)
            sysclr = child.find(".//a:sysClr", ns)
            val = (
                srgb.attrib.get("val")
                if srgb is not None
                else (
                    sysclr.attrib.get("lastClr")
                    if sysclr is not None
                    else "000000"
                )
            )
            colors.append(val)
        return colors
    except Exception as e:
        logger.warning(f"Failed to parse theme colors: {e}")
        return []


def tint_rgb(hex_rgb: str, tint: float) -> str:
    """Applies an Excel tint/shade factor to a 6-character hex RGB string."""
    hex_clean = hex_rgb.lstrip("#")
    if len(hex_clean) == 8:
        hex_clean = hex_clean[2:]
    if len(hex_clean) != 6:
        return f"#{hex_clean.upper()}"
    try:
        r = int(hex_clean[0:2], 16)
        g = int(hex_clean[2:4], 16)
        b = int(hex_clean[4:6], 16)
        if tint > 0:
            r = int(r * (1.0 - tint) + 255 * tint)
            g = int(g * (1.0 - tint) + 255 * tint)
            b = int(b * (1.0 - tint) + 255 * tint)
        elif tint < 0:
            r = int(r * (1.0 + tint))
            g = int(g * (1.0 + tint))
            b = int(b * (1.0 + tint))
        r = max(0, min(255, r))
        g = max(0, min(255, g))
        b = max(0, min(255, b))
        return f"#{r:02X}{g:02X}{b:02X}"
    except (ValueError, IndexError):
        return f"#{hex_clean.upper()}"


def get_cell_color(cell, theme_colors: list[str]) -> str | None:
    """
    Extracts normalized hex color (#RRGGBB) from cell fill or font.
    Supports RGB, theme colors with tint, and indexed colors.
    """
    from openpyxl.styles.colors import COLOR_INDEX

    fg = cell.fill.fgColor if cell.fill else None
    fill_type = cell.fill.fill_type if cell.fill else None

    # Check cell fill
    if fg and fill_type and fill_type != "none":
        c_type = getattr(fg, "type", None)
        if c_type == "rgb":
            rgb_str = str(fg.rgb)
            if len(rgb_str) == 8:
                rgb_str = rgb_str[2:]  # Strip alpha channel
            rgb_upper = rgb_str.upper()
            if rgb_upper != "000000" and rgb_upper != "FFFFFF":
                return f"#{rgb_upper}"
            elif fill_type == "solid":
                return f"#{rgb_upper}"
        elif c_type == "theme":
            theme_idx = fg.theme
            if 0 <= theme_idx < len(theme_colors):
                base_rgb = theme_colors[theme_idx]
                tint = getattr(fg, "tint", 0.0) or 0.0
                hex_c = tint_rgb(base_rgb, tint)
                if hex_c not in ("#000000", "#FFFFFF"):
                    return hex_c
        elif c_type == "indexed":
            idx = fg.indexed
            if 0 <= idx < len(COLOR_INDEX):
                raw = COLOR_INDEX[idx]
                if len(raw) == 8:
                    raw = raw[2:]
                hex_c = f"#{raw.upper()}"
                if hex_c not in ("#000000", "#FFFFFF"):
                    return hex_c

    # Check font color if fill was not set
    if cell.font and cell.font.color:
        f_fg = cell.font.color
        f_type = getattr(f_fg, "type", None)
        if f_type == "rgb":
            rgb_str = str(f_fg.rgb)
            if len(rgb_str) == 8:
                rgb_str = rgb_str[2:]
            rgb_upper = rgb_str.upper()
            if rgb_upper not in ("000000", "FFFFFF"):
                return f"#{rgb_upper}"
        elif f_type == "theme":
            theme_idx = f_fg.theme
            if 0 <= theme_idx < len(theme_colors):
                base_rgb = theme_colors[theme_idx]
                tint = getattr(f_fg, "tint", 0.0) or 0.0
                hex_c = tint_rgb(base_rgb, tint)
                if hex_c not in ("#000000", "#FFFFFF"):
                    return hex_c

    return None


def _find_target_column(headers: list, target_col: str | None = None) -> tuple[int | None]:
    """Finds target variant column in header row."""
    if target_col:
        target_lower = target_col.strip().lower()
        for idx, h in enumerate(headers, start=1):
            if h and str(h).strip().lower() == target_lower:
                return idx

    return None


def detect_excel_colors_service(file_bytes: bytes, target_col: str | None = None) -> dict:
    r"""
    Scans Excel sheets matching Caliber's patient pattern (^\d+-\d+.*$ or single sheet),
    locates the target column (e.g. HGVSc), and collects distinct cell colors with frequencies.
    """
    import openpyxl

    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    theme_colors = extract_theme_colors(wb)

    sheet_names = wb.sheetnames
    is_single_sheet = len(sheet_names) == 1

    color_stats: dict[str, dict] = {}
    processed_sheets = []
    total_variants = 0
    uncolored_count = 0

    for sheet in sheet_names:
        if not re.match(r"^\d+-\d+.*$", sheet) and not is_single_sheet:
            continue

        ws = wb[sheet]
        if ws.max_row < 2:
            continue

        headers = [ws.cell(row=1, column=c).value for c in range(1, ws.max_column + 1)]
        col_idx = _find_target_column(headers, target_col)
        if not col_idx:
            continue

        processed_sheets.append(sheet)

        for r in range(2, ws.max_row + 1):
            cell = ws.cell(row=r, column=col_idx)
            val = str(cell.value).strip() if cell.value is not None else ""
            if not val and cell.fill is None:
                continue

            total_variants += 1
            hex_c = get_cell_color(cell, theme_colors)
            if hex_c:
                hex_upper = hex_c.upper()
                if hex_upper not in color_stats:
                    color_stats[hex_upper] = {
                        "hex": hex_upper,
                        "count": 0,
                        "example": val[:60] if val else "",
                    }
                color_stats[hex_upper]["count"] += 1
                if not color_stats[hex_upper]["example"] and val:
                    color_stats[hex_upper]["example"] = val[:60]
            else:
                uncolored_count += 1

    colors_list = sorted(
        color_stats.values(), key=lambda x: x["count"], reverse=True
    )

    return {
        "target_column": target_col,
        "sheets_count": len(processed_sheets),
        "sheets": processed_sheets,
        "total_variants": total_variants,
        "uncolored_count": uncolored_count,
        "colors": colors_list,
    }


def _color_distance(c1: str, c2: str) -> float:
    """Euclidean distance between two 6-character hex colors."""
    try:
        r1, g1, b1 = int(c1[1:3], 16), int(c1[3:5], 16), int(c1[5:7], 16)
        r2, g2, b2 = int(c2[1:3], 16), int(c2[3:5], 16), int(c2[5:7], 16)
        return ((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2) ** 0.5
    except Exception:
        return 999.0


def convert_excel_colors_to_categories_service(
    file_bytes: bytes,
    color_mapping: dict,
    target_col: str | None = None,
    uncolored_category: str | float | int | None = None,
) -> io.BytesIO:
    """
    Reads an uploaded Excel file, iterates through patient sheets, maps cell colors in target_col
    to category string values (e.g. '5', '4-5', '2-3', '6', '7', '8', '-1'),
    adds/updates the 'Kategorie' column, and returns the modified workbook.
    """
    import openpyxl

    wb = openpyxl.load_workbook(io.BytesIO(file_bytes))
    theme_colors = extract_theme_colors(wb)

    sheet_names = wb.sheetnames
    is_single_sheet = len(sheet_names) == 1

    score_to_str_map = {
        "1.5": "1-2",
        "2.5": "2-3",
        "3.5": "3-4",
        "4.5": "4-5",
    }

    # Normalize mapping keys to uppercase and values to clean strings
    normalized_mapping: dict[str, str] = {}
    for k, v in color_mapping.items():
        if v is not None and str(v).strip() != "":
            raw_v = str(v).strip()
            # If a float score was passed (e.g. "2.5"), convert to string representation "2-3"
            normalized_mapping[str(k).strip().upper()] = score_to_str_map.get(raw_v, raw_v)

    for sheet in sheet_names:
        if not re.match(r"^\d+-\d+.*$", sheet) and not is_single_sheet:
            continue

        ws = wb[sheet]
        if ws.max_row < 1:
            continue

        headers = [ws.cell(row=1, column=c).value for c in range(1, ws.max_column + 1)]
        col_idx = _find_target_column(headers, target_col)
        if not col_idx:
            continue

        # Look for existing Kategorie column
        kategorie_col = None
        for idx, h in enumerate(headers, start=1):
            if h and str(h).strip().lower() == "kategorie":
                kategorie_col = idx
                break

        if not kategorie_col:
            kategorie_col = ws.max_column + 1
            ws.cell(row=1, column=kategorie_col, value="Kategorie")

        for r in range(2, ws.max_row + 1):
            cell = ws.cell(row=r, column=col_idx)
            hex_c = get_cell_color(cell, theme_colors)

            matched_category = None
            if hex_c:
                hex_upper = hex_c.upper()
                if hex_upper in normalized_mapping:
                    matched_category = normalized_mapping[hex_upper]
                else:
                    # Fuzzy match with tolerance if user picked approximate color
                    best_match = None
                    best_dist = 30.0  # Tolerance threshold
                    for map_hex, cat_val in normalized_mapping.items():
                        dist = _color_distance(hex_upper, map_hex)
                        if dist < best_dist:
                            best_dist = dist
                            best_match = cat_val
                    if best_match is not None:
                        matched_category = best_match

            if matched_category is not None:
                ws.cell(row=r, column=kategorie_col, value=str(matched_category))
            elif uncolored_category is not None and str(uncolored_category).strip() != "" and not hex_c:
                uncol_str = str(uncolored_category).strip()
                ws.cell(row=r, column=kategorie_col, value=score_to_str_map.get(uncol_str, uncol_str))

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output

import io
import logging
import os
import re
import tempfile
import polars as pl
from django.db import transaction
from apps import core
from apps.core.management.commands.init_db import parse_df, sheet_exists
from openpyxl import load_workbook
from django.db.models import Q, Subquery, OuterRef
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from apps.core.models import Gene, GeneVariant, PatientVariant, User
from apps.core.enums import ClassificationEnum
from apps.core.management.commands.init_db import (
    parse_excel_genes,
    parse_excel_dbsnp,
    parse_excel_hgvs,
    parse_patient_id,
)

logger = logging.getLogger(__name__)


def query_variants(
    variant: str, gene: str, dbsnp: str, page_number: int | str, per_page: int | str
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
                "meta": {"has_next": False, "total_count": 0, "total_pages": 0},
            }

    # 2. Sestavení filtrů pro klinickou DB
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

    patient_queryset = (
        PatientVariant.objects.select_related(
            "variant", "variant__clinvar_entry", "report", "report__patient", "report__created_by"
        )
        .prefetch_related("variant__annotations", "variant__genes")
        .filter(patient_filters)
        .distinct()
        .order_by("-report__updated_at")
    )

    is_fallback = False
    target_queryset = patient_queryset

    # 3. Fallback na globální ClinVar katalog, pokud lokální záznamy nic nenašly
    if not patient_queryset.exists():
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
                | Q(variation_type__iexact=variant)
            )

        target_queryset = (
            GeneVariant.objects.select_related("clinvar_entry")
            .prefetch_related("annotations", "genes")
            .filter(global_filters)
            .distinct()
            .order_by("chromosome", "position")
        )

    # 4. Spuštění Paginatoru
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
                "total_count": paginator.count,
                "total_pages": paginator.num_pages,
            },
        }

    # 5. Serializace datové struktury
    results = []
    for item in page_obj:
        var_obj = item.variant if not is_fallback else item

        transcripts = [
            f"{a.transcript_base or ''}.{a.transcript_version or ''}:{a.hgvs_c}".strip(
                ".:"
            )
            for a in var_obj.annotations.all()
        ]
        gene_symbols = [g.symbol for g in var_obj.genes.all()]

        clinvar_entry = getattr(var_obj, "clinvar_entry", None)
        clinvar_data = None
        if clinvar_entry:
            clinvar_data = {
                "id": clinvar_entry.clinvar_id,
                "score": clinvar_entry.clinvar_classification,
                "last_updated": clinvar_entry.last_updated.isoformat()
                if clinvar_entry.last_updated
                else None,
            }   

        if not is_fallback:
            creator = item.report.created_by
            created_by_user = creator.username if creator else "System"
            results.append(
                {
                    "source": "clinic",
                    "patient_id": item.report.patient.name,
                    "created_by": created_by_user,
                    "gene": ", ".join(gene_symbols) if gene_symbols else "Intergenic",
                    "all_genes": gene_symbols,
                    "variant": item.reported_hgvs_c
                    or (transcripts[0] if transcripts else ""),
                    "all_transcripts": transcripts,
                    "dbsnp": var_obj.dbsnp,
                    "gnomAD": var_obj.gnomAD,
                    "chromosome": var_obj.chromosome,
                    "position": var_obj.position,
                    "updated_at": item.report.updated_at.isoformat(),
                    "category": item.category or "",
                    "clinvar": clinvar_data,
                    "comment": item.comment or None,
                }
            )
        else:
            results.append(
                {
                    "source": "clinvar_catalog",
                    "patient_id": "-",
                    "created_by": "-",
                    "gene": ", ".join(gene_symbols) if gene_symbols else "Intergenic",
                    "all_genes": gene_symbols,
                    "variant": transcripts[0] if transcripts else "Unknown Transcript",
                    "all_transcripts": transcripts,
                    "dbsnp": var_obj.dbsnp,
                    "gnomAD": var_obj.gnomAD,
                    "chromosome": var_obj.chromosome,
                    "position": var_obj.position,
                    "updated_at": None,
                    "category": "N/A",
                    "clinvar": clinvar_data,
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
        workbook = load_workbook(tmp_path, read_only=True)
        sheet_names = workbook.sheetnames
        logger.info(f"Processing uploaded file '{name}' with sheets: {sheet_names}")
        rows_processed = 0
        for sheet in sheet_names:
            if re.match(r"^\d+-\d+.*$", sheet): # [1-9]*-[1-9]*... pattern
                df = pl.read_excel(tmp_path, sheet_name=sheet)
                patient_id = parse_patient_id(sheet)
                with transaction.atomic():
                    parse_df(df, name, user=user, patient_id=patient_id)
                    rows_processed += df.height

        return {"filename": name, "rows": rows_processed}
    finally:
        workbook.close()
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


def get_variant_hashes_from_db(
    unique_dbsnps: list[str], unique_variants: list[str]
) -> tuple[dict, dict]:
    """
    Queries the database for GeneVariant entries matching the provided dbSNP IDs and HGVS notations, and constructs two hash maps:
    1. dbsnp_map: Maps cleaned dbSNP IDs to their classification and ClinVar ID.
    2. hgvs_map: Maps cleaned HGVS notations (with and without gene symbol) to their classification and ClinVar ID.
    """
    dbsnp_map = {}
    hgvs_map = {}

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

            final_score, match_status = format_classification(
                clinic_score, clinvar_score
            )

            variant_data = {
                "final_score": final_score,
                "clinvar_id": clinvar_id,
                "status": match_status,
            }

            if gv.dbsnp:
                dbsnp_map[gv.dbsnp.strip().lower()] = variant_data

            variant_genes = [g.symbol.strip().lower() for g in gv.genes.all()]

            for ann in gv.annotations.all():
                if ann.hgvs_c:
                    c_clean = ann.hgvs_c.strip()
                    # Záložní klíč bez genu pro případ prázdného variant_genes
                    hgvs_map[c_clean] = variant_data
                    for g_sym in variant_genes:
                        hgvs_map[(g_sym, c_clean)] = variant_data

    return dbsnp_map, hgvs_map


#TODO: Choose correct sheet for annotation, currently it takes the active
def annotate_excel_workbook(
    file_bytes: bytes, dbsnp_map: dict, hgvs_map: dict
) -> io.BytesIO:
    """
    Loads the uploaded Excel file, iterates through its rows, and annotates each variant based on dbSNP ID or HGVS notation using the provided hash maps.
    Adds three new columns for classification, ClinVar ID, and match status. Returns a Bytes
    """

    wb = load_workbook(io.BytesIO(file_bytes))
    ws = wb.active

    orig_headers = [cell.value for cell in ws[1]]
    openpyxl_gene_idx = openpyxl_variant_idx = openpyxl_dbsnp_idx = None

    for idx, h_name in enumerate(orig_headers, start=1):
        if not h_name:
            continue
        low = str(h_name).lower()
        if low in ["symbol", "gene"]:
            openpyxl_gene_idx = idx
        elif low in ["nucleotide", "hgvsc"]:
            openpyxl_variant_idx = idx
        elif low in ["vep dbsnp id", "dbsnp"]:
            openpyxl_dbsnp_idx = idx

    start_col = len(orig_headers) + 1

    ws.cell(row=1, column=start_col, value="Zhodnoceni_Patogenity")
    ws.cell(row=1, column=start_col + 1, value="ClinVar_ID")
    ws.cell(row=1, column=start_col + 2, value="Status_Kontroly")

    for row_num in range(2, ws.max_row + 1):
        gene_val = (
            ws.cell(row=row_num, column=openpyxl_gene_idx).value
            if openpyxl_gene_idx
            else None
        )
        variant_val = (
            ws.cell(row=row_num, column=openpyxl_variant_idx).value
            if openpyxl_variant_idx
            else None
        )
        dbsnp_val = (
            ws.cell(row=row_num, column=openpyxl_dbsnp_idx).value
            if openpyxl_dbsnp_idx
            else None
        )

        g_clean = parse_excel_genes(gene_val) if gene_val else ""
        d_clean = parse_excel_dbsnp(str(dbsnp_val)) if dbsnp_val else ""

        _, _, hgvs = parse_excel_hgvs(str(variant_val)) if variant_val else ""
        logger.debug(
            f"Processing row {row_num}: Gene='{gene_val}', Variant='{variant_val}', dbSNP='{dbsnp_val}' -> Cleaned Gene='{g_clean}', Cleaned Variant='{hgvs}', Cleaned dbSNP='{d_clean}'"
        )

        match = None
        if d_clean and d_clean in dbsnp_map:
            match = dbsnp_map[d_clean]
        elif g_clean and hgvs:
            for g in g_clean:
                g = g.strip().lower()
                if (g, hgvs) in hgvs_map:
                    match = hgvs_map[(g, hgvs)]
                    break

        if not match and hgvs and hgvs in hgvs_map:
            match = hgvs_map[hgvs]

        if match:
            ws.cell(row=row_num, column=start_col, value=match["final_score"])
            ws.cell(row=row_num, column=start_col + 1, value=match["clinvar_id"])
            ws.cell(row=row_num, column=start_col + 2, value=match["status"])
        else:
            ws.cell(row=row_num, column=start_col, value="Neklasifikováno")
            ws.cell(row=row_num, column=start_col + 1, value="—")
            ws.cell(row=row_num, column=start_col + 2, value="Nenalezeno v DB")

    output = io.BytesIO()
    wb.save(output)
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
        PatientVariant.objects.filter(category__gte=4.0)
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
        8.0 : {"label": "Somatická varianta", "class": "c8"},
        7.0 : {"label": "Farmakogenetický rizikový faktor", "class": "c7"},
        6.0 : {"label": "Hypomorfní varianta", "class": "c6"},
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
                "label": f"Kategorie {cat_val}"
                if cat_val is not None
                else "Neuvedeno",
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
        zygosities_breakdown.append(
            {"label": label, "count": count, "percentage": pct}
        )
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
        pct = (
            round((p_count / total_patients) * 100, 1)
            if total_patients > 0
            else 0.0
        )
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


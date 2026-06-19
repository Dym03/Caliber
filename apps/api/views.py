import os
import tempfile

import polars as pl
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from apps.core.management.commands.init_db import parse_df, sheet_exists
from apps.core.models import Gene, GeneVariant, PatientVariant


def search_variants(request):
    """
    Search for variants based on query parameters.
    Query Parameters:
    - variant: The variant identifier (e.g., HGVS notation).
    - gene: The gene symbol (e.g., BRCA1).
    - dbsnp: The dbSNP identifier (e.g., rs123456).
    - page: The page number for pagination (default: 1).
    - per_page: The number of results per page (default: 50).
    Returns:
    - JSON response containing the search results and pagination metadata.

    The search first attempts to find matching variants in the internal patient records.
    If no matches are found, it falls back to searching the ClinVar database.
    """
    variant = request.GET.get("variant", "").strip()
    gene = request.GET.get("gene", "").strip()
    dbsnp = request.GET.get("dbsnp", "").strip()

    page_number = request.GET.get("page", 1)
    per_page = request.GET.get("per_page", 50)

    if not (variant or gene or dbsnp):
        return JsonResponse(
            {"results": [], "meta": {"has_next": False, "total_count": 0}}
        )

    # =========================================================================
    # STEP 1: Attempt to search internal Patient Records first
    # =========================================================================
    gene_id = None  # Simplify search by using the Gene ID directly for filtering
    if gene:
        gene_id = (
            Gene.objects.filter(symbol__iexact=gene)
            .values_list("id", flat=True)
            .first()
        )
        # Fast-fail: If they searched a gene that doesn't exist, stop immediately
        if not gene_id:
            return JsonResponse(
                {
                    "results": [],
                    "meta": {"has_next": False, "total_count": 0, "total_pages": 0},
                }
            )

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
            "variant", "variant__clinvar_entry", "report", "report__patient"
        )
        .prefetch_related("variant__annotations", "variant__genes")
        .filter(patient_filters)
        .distinct()
        .order_by("-report__updated_at")
    )

    results = []
    is_fallback = False
    target_queryset = patient_queryset

    if not patient_queryset.exists():
        is_fallback = True
        global_filters = Q()

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
            .order_by(
                "chromosome", "position"
            )  # Consistent order is critical for pagination
        )

    # =========================================================================
    # STEP 2: Execute Pagination on whichever target dataset won
    # =========================================================================
    paginator = Paginator(target_queryset, per_page)

    try:
        page_obj = paginator.page(page_number)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        return JsonResponse(
            {"results": [], "meta": {"has_next": False, "total_count": paginator.count}}
        )

    # =========================================================================
    # STEP 3: Serialize data based on data source branch
    # =========================================================================
    for item in page_obj:
        # Resolve object based on whether we are looping over PatientVariant or GeneVariant
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
            # Structuring patient data row
            results.append(
                {
                    "source": "clinic",
                    "patient_id": item.report.patient.name,
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
            # Structuring global reference catalog row
            results.append(
                {
                    "source": "clinvar_catalog",
                    "patient_id": "-",
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

    # Return results alongside standard pagination metadata
    return JsonResponse(
        {
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
    )


@require_POST
def upload_variants_file(request):
    """
    Handle the upload of variant files (Excel) and process them to populate the database.
    Expects files to be uploaded under the "file" key in the request.
    Returns a JSON response indicating the success or failure of the operation.
    """
    uploaded_files = request.FILES.getlist("file")
    if not uploaded_files:
        return JsonResponse({"error": "No file provided."}, status=400)

    allowed_extensions = {".xlsx", ".xls", ".csv"}
    for uploaded in uploaded_files:
        name_lower = uploaded.name.lower()
        if not any(name_lower.endswith(ext) for ext in allowed_extensions):
            return JsonResponse(
                {"error": f"Unsupported file type: {uploaded.name}."},
                status=400,
            )

    results = []
    for uploaded in uploaded_files:
        name = uploaded.name
        name_lower = name.lower()
        suffix = os.path.splitext(name_lower)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            for chunk in uploaded.chunks():
                tmp_file.write(chunk)
            tmp_path = tmp_file.name

        try:
            if suffix == ".csv":
                df = pl.read_csv(tmp_path)
            elif suffix == ".xlsx" and sheet_exists(tmp_path, "default"):
                df = pl.read_excel(tmp_path, sheet_name="default")
            else:
                try:
                    df = pl.read_excel(tmp_path, sheet_name="Filtr JI")
                except Exception:
                    df = pl.read_excel(tmp_path)

            with transaction.atomic():
                parse_df(df, name)
            row_count = df.height
        finally:
            os.unlink(tmp_path)

        results.append({"filename": name, "rows": row_count})

    return JsonResponse(
        {
            "filenames": [item["filename"] for item in results],
            "rows": sum(item["rows"] for item in results),
            "files": results,
        }
    )

import logging
import io
import json
import polars as pl
from django.http import HttpResponse, JsonResponse, Http404
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.core.exceptions import PermissionDenied

from apps.core.auth import login_required_json, parse_request_data
from apps.api.services import (
    annotate_excel_workbook,
    get_dashboard_statistics,
    get_variant_hashes_from_db,
    process_uploaded_variants_file,
    query_variants,
    delete_patient_variant,
    update_patient_variant,
    delete_genetic_report,
    detect_excel_colors_service,
    convert_excel_colors_to_categories_service,
)
from apps.core.management.commands.init_db import (
    parse_excel_dbsnp_list,
    parse_excel_hgvs,
)

logger = logging.getLogger(__name__)


@login_required_json
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
    patient_id = request.GET.get("patient_id", "").strip()
    sort_by = request.GET.get("sort", "genomic").strip()
    page_number = request.GET.get("page", 1)
    per_page = request.GET.get("per_page", 20)

    if not (variant or gene or dbsnp or patient_id):
        return JsonResponse(
            {"results": [], "meta": {"has_next": False, "total_count": 0}}
        )

    try:
        response_data = query_variants(
            variant,
            gene,
            dbsnp,
            page_number,
            per_page,
            patient_id=patient_id,
            sort_by=sort_by,
            user=request.user,
        )
        return JsonResponse(response_data)
    except Exception as e:
        logger.exception(f"Chyba při vyhledávání variant. {str(e)}")
        return JsonResponse(
            {
                "error": "Chyba při vyhledávaní variant. V případě závažné chyby požádejte spávce o výpis logu"
            },
            status=500,
        )


@require_POST
@login_required_json
def upload_variants_file(request):
    """
    Handle the upload of variant files (Excel) and process them to populate the database.
    Expects files to be uploaded under the "file" key in the request.
    Returns a JSON response indicating the success or failure of the operation.
    """
    user = request.user

    uploaded_files = request.FILES.getlist("file")
    if not uploaded_files:
        return JsonResponse({"error": "No file provided."}, status=400)

    allowed_extensions = {".xlsx", ".xls"}
    for uploaded in uploaded_files:
        if not any(uploaded.name.lower().endswith(ext) for ext in allowed_extensions):
            return JsonResponse(
                {
                    "error": f"Nepodporovaný formát souboru: {uploaded.name}. Nahrajte prosím .xlsx, nebo .xls soubor."
                },
                status=400,
            )

    results = []
    try:
        for uploaded in uploaded_files:
            file_result = process_uploaded_variants_file(uploaded, user=user)
            results.append(file_result)

        return JsonResponse(
            {
                "filenames": [item["filename"] for item in results],
                "rows": sum(item["rows"] for item in results),
                "files": results,
            }
        )
    except Exception as e:
        logger.exception(f"Chyba při nahrávání souboru variant.{str(e)}")
        return JsonResponse(
            {"error": "Chyba při zpracování souborů: požádejte správce o výpis logu"},
            status=500,
        )


@require_POST
@login_required_json
def classify_variants(request):
    """
    Handle the upload of an Excel file containing variants and classify them based on internal and ClinVar data.
    """

    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return JsonResponse({"error": "No file provided."}, status=400)

    allowed_extensions = {".xlsx", ".xls"}
    name_lower = uploaded_file.name.lower()
    if not any(name_lower.endswith(ext) for ext in allowed_extensions):
        return JsonResponse(
            {
                "error": f"Nepodporovaný formát souboru: {uploaded_file.name}. Nahrajte prosím .xlsx, nebo .xls soubor."
            },
            status=400,
        )

    try:
        file_bytes = uploaded_file.read()
        df = pl.read_excel(io.BytesIO(file_bytes))

        hgsv_c_col = None
        dbsnp_col = None

        for orig_col in df.columns:
            low = orig_col.lower()
            if low in ["nucleotide", "hgvsc"]:
                hgsv_c_col = orig_col
            elif low in ["vep dbsnp id", "dbsnp"]:
                dbsnp_col = orig_col

        if not (hgsv_c_col or dbsnp_col):
            return JsonResponse(
                {
                    "error": "Chybná struktura Excelu. Tabulka musí obsahovat alespoň jeden ze sloupců: Varianta, dbSNP."
                },
                status=400,
            )

        unique_dbsnps = []
        unique_variants = []

        if dbsnp_col:
            for x in df[dbsnp_col].drop_nulls().unique().to_list():
                for rs in parse_excel_dbsnp_list(x):
                    if rs not in unique_dbsnps:
                        unique_dbsnps.append(rs)

        if hgsv_c_col:
            raw_variants = [
                str(x).strip()
                for x in df[hgsv_c_col].drop_nulls().unique().to_list()
                if str(x).strip()
            ]

            for v in raw_variants:
                _, _, hgvs = parse_excel_hgvs(v)
                if hgvs:
                    unique_variants.append(hgvs)

        dbsnp_map, hgvs_map = get_variant_hashes_from_db(unique_dbsnps, unique_variants)

        output = annotate_excel_workbook(file_bytes, dbsnp_map, hgvs_map)

        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = (
            'attachment; filename="analyzovaný_report.xlsx"'
        )
        return response

    except Exception as e:
        logger.exception(f"Chyba při analýze dokumentu {str(e)}")
        return JsonResponse(
            {
                "error": "Chyba serveru při analýze: zkontrolujte strukturu, případně požádejte spŕavce o výpis logu."
            },
            status=500,
        )


@require_POST
@login_required_json
def detect_excel_colors(request):
    """
    Detects distinct cell colors used in the HGVSc/variant column across patient sheets.
    Returns JSON with detected colors, counts, and examples.
    """
    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return JsonResponse({"error": "Nebyl vybrán žádný soubor."}, status=400)

    name_lower = uploaded_file.name.lower()
    if not name_lower.endswith(".xlsx"):
        return JsonResponse(
            {
                "error": f"Nepodporovaný formát souboru: {uploaded_file.name}. Nahrajte prosím .xlsx soubor."
            },
            status=400,
        )

    target_column = request.POST.get("target_column")
    try:
        file_bytes = uploaded_file.read()
        result = detect_excel_colors_service(file_bytes, target_col=target_column)
        return JsonResponse(result)
    except Exception as e:
        logger.exception(f"Chyba při detekci barev v Excelu: {str(e)}")
        return JsonResponse(
            {"error": f"Chyba při čtení stylů ze souboru: {str(e)}"},
            status=500,
        )


@require_POST
@login_required_json
def convert_colors_to_categories(request):
    """
    Reads an uploaded Excel file, applies color-to-category mapping to the target column,
    adds/updates the 'Kategorie' column, and returns the modified workbook for download.
    """
    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return JsonResponse({"error": "Nebyl vybrán žádný soubor."}, status=400)

    name_lower = uploaded_file.name.lower()
    if not (name_lower.endswith(".xlsx")):
        return JsonResponse(
            {
                "error": f"Nepodporovaný formát souboru: {uploaded_file.name}. Nahrajte prosím .xlsx soubor."
            },
            status=400,
        )

    raw_mapping = request.POST.get("mapping", "{}")
    try:
        color_mapping = (
            json.loads(raw_mapping) if isinstance(raw_mapping, str) else raw_mapping
        )
    except Exception:
        return JsonResponse({"error": "Neplatný formát mapování barev."}, status=400)

    target_column = request.POST.get("target_column")
    uncolored_category = request.POST.get("uncolored_category")

    try:
        file_bytes = uploaded_file.read()
        output = convert_excel_colors_to_categories_service(
            file_bytes=file_bytes,
            color_mapping=color_mapping,
            target_col=target_column,
            uncolored_category=uncolored_category,
        )

        orig_name = uploaded_file.name
        out_filename = f"kategorie_{orig_name}"
        if not out_filename.endswith(".xlsx"):
            out_filename += ".xlsx"

        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{out_filename}"'
        return response
    except Exception as e:
        logger.exception(f"Chyba při převodu barev na kategorie: {str(e)}")
        return JsonResponse(
            {"error": f"Chyba při zpracování souboru: {str(e)}"},
            status=500,
        )


@require_GET
@login_required_json
def dashboard_stats(request):
    """
    Returns aggregated statistical telemetry for the database dashboard.
    """
    try:
        data = get_dashboard_statistics()
        return JsonResponse(data)
    except Exception as e:
        logger.exception(f"Chyba při načítání statistik databáze: {str(e)}")
        return JsonResponse(
            {
                "error": "Chyba při načítání statistik databáze: v případě potřeby požádejte správce o výpis z logu."
            },
            status=500,
        )


@login_required_json
@require_http_methods(["DELETE", "PATCH", "POST", "PUT"])
def patient_variant_detail_view(request, variant_id: int):
    """
    Deletes or updates a specific patient variant observation.
    """
    if request.method == "DELETE":
        try:
            result = delete_patient_variant(variant_id, request.user)
            return JsonResponse(result)
        except Http404 as e:
            return JsonResponse({"error": str(e)}, status=404)
        except PermissionDenied as e:
            return JsonResponse({"error": str(e)}, status=403)
        except Exception as e:
            logger.exception(f"Chyba při mazání varianty. {str(e)}")
            return JsonResponse(
                {"error": f"Internal server error: {str(e)}"}, status=500
            )
    else:
        try:
            data = parse_request_data(request)
            category = data.get("category")
            comment = data.get("comment")
            result = update_patient_variant(
                variant_id,
                request.user,
                category=category,
                comment=comment,
            )
            return JsonResponse(result)
        except Http404 as e:
            return JsonResponse({"error": str(e)}, status=404)
        except PermissionDenied as e:
            return JsonResponse({"error": str(e)}, status=403)
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)
        except Exception as e:
            logger.exception("Chyba při aktualizaci hodnocení varianty.")
            return JsonResponse(
                {"error": f"Internal server error: {str(e)}"}, status=500
            )


delete_patient_variant_view = patient_variant_detail_view


@login_required_json
@require_http_methods(["DELETE", "POST"])
def delete_genetic_report_view(request, report_id: int):
    """
    Deletes an entire genetic report and all associated patient variants.
    Requires user to be the report creator or staff/superuser.
    """
    try:
        result = delete_genetic_report(report_id, request.user)
        return JsonResponse(result)
    except Http404 as e:
        return JsonResponse({"error": str(e)}, status=404)
    except PermissionDenied as e:
        return JsonResponse({"error": str(e)}, status=403)
    except Exception as e:
        logger.exception(f"Chyba při mazání reportu.{str(e)}")
        return JsonResponse({"error": f"Internal server error: {str(e)}"}, status=500)

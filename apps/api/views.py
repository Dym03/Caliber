import os
import tempfile

import polars as pl
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from apps.core.management.commands.init_db import parse_df, sheet_exists
from apps.core.models import PatientVariant

def search_variants(request):
    variant = request.GET.get("variant", "").strip()
    gene = request.GET.get("gene", "").strip()
    dbsnp = request.GET.get("dbsnp", "").strip()

    if not (variant or gene or dbsnp):
        return JsonResponse({"results": []})

    filters = Q()
    if gene:
        filters &= Q(variant__genes__symbol__icontains=gene)
    if dbsnp:
        filters &= Q(variant__dbsnp__icontains=dbsnp)
    if variant:
        filters &= (
            Q(variant__annotations__hgvs_c__icontains=variant)
            | Q(variant__annotations__hgvs_p__icontains=variant)
            | Q(variant__variation_type__icontains=variant)
            | Q(reported_hgvs_c__icontains=variant)
        )

    # OPTIMIZATION: select_related fetches the 1-to-1 clinvar_entry and foreign keys in ONE query.
    # prefetch_related efficiently handles the 1-to-many annotations and many-to-many genes.
    queryset = (
        PatientVariant.objects.select_related(
            "variant", 
            "variant__clinvar_entry", 
            "report", 
            "report__patient"
        )
        .prefetch_related("variant__annotations", "variant__genes")
        .filter(filters)
        .distinct()
        .order_by("-report__updated_at")[:200]
    )

    results = []
    for item in queryset:
        # Resolve transcript annotations
        transcripts = [
            f"{a.transcript_base or ''}.{a.transcript_version or ''}:{a.hgvs_c}".strip(".:")
            for a in item.variant.annotations.all()
        ]

        gene_symbols = [g.symbol for g in item.variant.genes.all()]

        # Safely fetch the OneToOne ClinVar entry if it exists for this genomic variant
        clinvar_entry = getattr(item.variant, "clinvar_entry", None)
        
        clinvar_data = None
        if clinvar_entry:
            # Reconstruct the classification string from your Enum using the float score if needed, 
            # or just return the structural details directly.
            clinvar_data = {
                "id": clinvar_entry.clinvar_id,
                "score": clinvar_entry.clinvar_classification,  # Your 1.0 - 5.0 float
                "last_updated": clinvar_entry.last_updated.isoformat() if clinvar_entry.last_updated else None,
            }

        results.append({
            "patient_id": item.report.patient.name,
            "gene": ", ".join(gene_symbols) if gene_symbols else "Intergenic",
            "all_genes": gene_symbols, 
            "variant": item.reported_hgvs_c or (transcripts[0] if transcripts else ""),
            "all_transcripts": transcripts,
            "dbsnp": item.variant.dbsnp,
            "gnomAD": item.variant.gnomAD,  # Pulled from your clean GeneVariant model fields
            "chromosome": item.variant.chromosome,
            "position": item.variant.position,
            "updated_at": item.report.updated_at.isoformat(),
            "category": item.category or "", # Patient variant specific category
            
            # This will be null if ClinVar hasn't cataloged this coordinate yet
            "clinvar": clinvar_data, 
			"comment": item.comment or None,  # Optional comment field
        })

    return JsonResponse({"results": results})


@require_POST
def upload_variants_file(request):
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

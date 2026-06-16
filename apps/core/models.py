from django.db import models

class Patient(models.Model):
    name = models.CharField(max_length=120, unique=True)

class Gene(models.Model):
    symbol = models.CharField(max_length=32, unique=True)

# class GeneVariant(models.Model):
#     gene = models.ForeignKey(Gene, on_delete=models.PROTECT)

#     variation_type = models.CharField(max_length=32, blank=True)
#     chromosome = models.CharField(max_length=8)
#     position = models.BigIntegerField(null=True)

#     hgvs_c = models.CharField(max_length=120, blank=True)
#     hgvs_p = models.CharField(max_length=120, blank=True)

#     dbsnp = models.CharField(max_length=64, blank=True)

#     class Meta:
#         constraints = [
#             models.UniqueConstraint(
#                 fields=["gene", "chromosome", "position", "variation_type", "hgvs_c"],
#                 name="unique_genomic_variant"
#             )
#         ]
class GeneVariant(models.Model):
    genes = models.ManyToManyField(Gene, related_name="variants")

    chromosome = models.CharField(max_length=8)
    position = models.BigIntegerField(null=True)
    
    ref_allele = models.CharField(max_length=255) 
    alt_allele = models.CharField(max_length=255) 
    
    variation_type = models.CharField(max_length=32, blank=True)

    dbsnp = models.CharField(max_length=64, blank=True)
    gnomAD = models.CharField(max_length=64, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["chromosome", "position", "variation_type", "ref_allele", "alt_allele"],
                name="unique_genomic_variant"
            )
        ]

class TranscriptAnnotation(models.Model):
    """
    Holds the 1-to-many relationship of transcripts to a variant.
    ClinVar will populate multiple of these; Excel will populate one.
    """
    variant = models.ForeignKey(GeneVariant, on_delete=models.CASCADE, related_name="annotations")
    
    transcript_base = models.CharField(max_length=32, db_index=True, null=True, blank=True)  # e.g., "NM_000059"
    transcript_version = models.IntegerField(null=True, blank=True)   # e.g., 3 // The version might change over time, so we store it separately from the base transcript ID.
    hgvs_c = models.CharField(max_length=120, db_index=True, null=True, blank=True)          # e.g., "c.432A>G"
    hgvs_p = models.CharField(max_length=120, blank=True)

    exon = models.CharField(max_length=32, blank=True) # Exon number is transcript-dependent

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["variant", "hgvs_c"], 
                name="unique_variant_transcript_annotation"
            )
        ]

class GeneticReport(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="reports"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    report_name = models.CharField(max_length=120, blank=True)

# class PatientVariant(models.Model):
#     report = models.ForeignKey(
#         GeneticReport,
#         on_delete=models.CASCADE,
#         related_name="variants"
#     )
#     variant = models.ForeignKey(GeneVariant, on_delete=models.CASCADE)

#     exon = models.CharField(max_length=32, blank=True)
#     gnomAD = models.CharField(max_length=64, blank=True)
#     zygosity = models.CharField(max_length=32, blank=True)
#     category = models.CharField(max_length=80, blank=True)
#     comment = models.TextField(blank=True)

#     class Meta:
        # unique_together = ("report", "variant")

class PatientVariant(models.Model):
    """
    Strictly data regarding THIS patient's observation of the variant.
    """
    report = models.ForeignKey(GeneticReport, on_delete=models.CASCADE, related_name="variants")
    variant = models.ForeignKey(GeneVariant, on_delete=models.CASCADE)
    
    zygosity = models.CharField(max_length=32, blank=True)
    category = models.FloatField(null=True, blank=True) # e.g., Lab's specific pathogenic call
    comment = models.TextField(blank=True)
    
    # original hgvs from excel
    reported_hgvs_c = models.CharField(max_length=120, blank=True) 

    class Meta:
        unique_together = ("report", "variant")

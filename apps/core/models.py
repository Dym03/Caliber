from django.db import models


class Patient(models.Model):
    name = models.CharField(max_length=120, unique=True)

class Gene(models.Model):
    symbol = models.CharField(max_length=32, unique=True)

class GeneVariant(models.Model):
    genes = models.ManyToManyField(Gene, related_name="variants")

    variation_type = models.CharField(max_length=32, blank=True)
    chromosome = models.CharField(max_length=8)
    position = models.BigIntegerField(null=True)
    ref = models.TextField(null=True, blank=True)
    alt = models.TextField(null=True, blank=True)

    dbsnp = models.CharField(max_length=64, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["chromosome", "position", "variation_type", "ref", "alt"],
                name="unique_genomic_variant"
            )
        ]

class HGVS(models.Model):
    variant = models.ForeignKey(GeneVariant, on_delete=models.CASCADE, related_name="hgvs")

    hgvs_c = models.TextField(max_length=120, blank=True, null=True)
    hgvs_p = models.TextField(max_length=120, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["hgvs_c", "hgvs_p"],
                name="unique_hgvs_entry",
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

class PatientVariant(models.Model):
    report = models.ForeignKey(
        GeneticReport,
        on_delete=models.CASCADE,
        related_name="variants"
    )
    variant = models.ForeignKey(GeneVariant, on_delete=models.CASCADE)

    exon = models.CharField(max_length=32, blank=True)
    gnomAD = models.CharField(max_length=64, blank=True)
    zygosity = models.CharField(max_length=32, blank=True)
    category = models.CharField(max_length=80, blank=True)
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ("report", "variant")

class ClinVarGeneVariant(models.Model):
    gene_variant = models.OneToOneField(
        GeneVariant,
        on_delete=models.CASCADE,
        related_name="clinvar_entry",
    )
    clinvar_id = models.CharField(max_length=64)
    clinvar_url = models.URLField(max_length=300, blank=True)
    clinvar_category = models.CharField(max_length=80, blank=True)
    
    def __str__(self):
        return f"ClinVarGeneVariant(clinvar_id={self.clinvar_id}, gene_variant={self.gene_variant})"
from django.db import models

from apps.core.models import GeneVariant

# Create your models here.

class ClinVarGeneVariant(models.Model):
    """
    ClinVar-specific metadata.
    """
    gene_variant = models.OneToOneField(
        GeneVariant,
        on_delete=models.CASCADE,
        related_name="clinvar_entry",
    )
    clinvar_id = models.CharField(max_length=64)
    clinvar_url = models.URLField(max_length=300, blank=True)
    clinvar_category = models.CharField(max_length=80, blank=True) # ClinVar's pathogenicity call
    last_updated = models.DateTimeField(null=True, blank=True)
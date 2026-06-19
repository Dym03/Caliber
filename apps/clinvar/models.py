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
    clinvar_classification = models.FloatField(null=True, blank=True)
    last_updated = models.DateTimeField(null=True, blank=True)

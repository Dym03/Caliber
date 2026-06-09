from django.db import models

from apps.core.models import GeneVariant

# Create your models here.

class ClinVarAnnotation(models.Model):
    variant = models.OneToOneField(GeneVariant, on_delete=models.CASCADE, related_name="clinvar_annotation")

    clinvar_variation_id = models.IntegerField()
    accession = models.CharField(max_length=32)

    classification = models.CharField(max_length=64)
    review_status = models.CharField(max_length=128)

    disease = models.CharField(max_length=256)

    hgvs = models.TextField()

    last_updated = models.DateField()
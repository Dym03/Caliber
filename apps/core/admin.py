from django.contrib import admin

from .models import ClinVarGeneVariant, Gene, GeneVariant, HGVS, Patient

admin.site.register(Gene)
admin.site.register(GeneVariant)
admin.site.register(HGVS)
admin.site.register(Patient)
admin.site.register(ClinVarGeneVariant)

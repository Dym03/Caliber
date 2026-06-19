from django.contrib import admin

from .models import (
    Gene,
    GeneVariant,
    GeneticReport,
    Patient,
    PatientVariant,
    TranscriptAnnotation,
)

admin.site.register(Patient)
admin.site.register(Gene)
admin.site.register(GeneVariant)
admin.site.register(TranscriptAnnotation)
admin.site.register(GeneticReport)
admin.site.register(PatientVariant)

from django.urls import path

from . import views

urlpatterns = [
    path("search/", views.search_variants, name="search_variants"),
    path("upload/", views.upload_variants_file, name="upload_variants_file"),
    path("classify/", views.classify_variants, name="classify_variants"),
    path("stats/", views.dashboard_stats, name="dashboard_stats"),
    path(
        "patient-variants/<int:variant_id>/",
        views.delete_patient_variant_view,
        name="delete_patient_variant",
    ),
    path(
        "reports/<int:report_id>/",
        views.delete_genetic_report_view,
        name="delete_genetic_report",
    ),
]

from django.conf import settings
from django.middleware.csrf import get_token
from django.shortcuts import render


def index(request):
    get_token(request)
    return render(
        request, "core/index.html", {"debug": settings.DEBUG}
    )  # Pass debug flag to template for conditional frontend behavior

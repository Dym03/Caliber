from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.conf import settings
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.shortcuts import render

from .auth import parse_request_data, serialize_user
from .models import User
from .ratelimit import rate_limit


from django.templatetags.static import static


def index(request):
    get_token(request)
    base_path = (
        request.META.get("HTTP_X_FORWARDED_PREFIX")
        or getattr(settings, "FORCE_SCRIPT_NAME", "")
        or ""
    ).rstrip("/")

    css_url = static("svelte/main.css")
    js_url = static("svelte/main.js")
    if base_path and not css_url.startswith(base_path):
        css_url = f"{base_path}{css_url}"
    if base_path and not js_url.startswith(base_path):
        js_url = f"{base_path}{js_url}"

    return render(
        request,
        "core/index.html",
        {
            "debug": settings.DEBUG,
            "base_path": base_path,
            "css_url": css_url,
            "js_url": js_url,
        },
    )


@require_GET
def auth_status(request):
    get_token(request)
    if request.user.is_authenticated:
        return JsonResponse(
            {"authenticated": True, "user": serialize_user(request.user)}
        )

    return JsonResponse({"authenticated": False, "user": None})


@require_POST
@rate_limit(
    action="login",
    max_requests=5,
    window_seconds=300,
    reset_on_success=True,
    error_message="Příliš mnoho neúspěšných pokusů o přihlášení. Zkuste to prosím znovu za 5 minut.",
)
def login_view(request):
    data = parse_request_data(request)
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return JsonResponse({"error": "E-mail a heslo jsou povinné položky."}, status=400)

    user = authenticate(request, email=email, password=password)
    if user is None:
        candidate = User.objects.filter(email=email).first()
        if candidate and candidate.check_password(password) and not candidate.is_active:
            return JsonResponse(
                {"error": "Váš účet čeká na schválení administrátorem."},
                status=403,
            )
        return JsonResponse({"error": "Neplatný e-mail nebo heslo."}, status=400)

    login(request, user)
    get_token(request)
    return JsonResponse({"authenticated": True, "user": serialize_user(user)})


@require_POST
@rate_limit(
    action="register",
    max_requests=10,
    window_seconds=300,
    reset_on_success=False,
    error_message="Příliš mnoho pokusů o registraci z této adresy. Zkuste to prosím znovu později.",
)
def register_view(request):
    data = parse_request_data(request)
    email = str(data.get("email", "")).strip().lower()
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    password_confirm = str(data.get("password_confirm", ""))

    if not email or not username or not password:
        return JsonResponse(
            {"error": "E-mail, uživatelské jméno a heslo jsou povinné položky."}, status=400
        )

    if password != password_confirm:
        return JsonResponse({"error": "Zadaná hesla se neshodují."}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse(
            {"error": "Účet s tímto e-mailem již existuje."}, status=400
        )

    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {"error": "Účet s tímto uživatelským jménem již existuje."}, status=400
        )

    dummy_user = User(email=email, username=username)
    try:
        validate_password(password, user=dummy_user)
    except ValidationError as e:
        return JsonResponse({"error": " ".join(e.messages)}, status=400)

    require_approval = getattr(settings, "REQUIRE_ACCOUNT_APPROVAL", False)
    user = User.objects.create_user(
        email=email,
        username=username,
        password=password,
        is_active=not require_approval,
    )

    if require_approval:
        return JsonResponse(
            {
                "authenticated": False,
                "pending_approval": True,
                "user": None,
                "message": "Účet byl úspěšně vytvořen a čeká na schválení administrátorem.",
            },
            status=201,
        )

    login(request, user)
    get_token(request)
    return JsonResponse(
        {"authenticated": True, "user": serialize_user(user)}, status=201
    )


@require_POST
def logout_view(request):
    logout(request)
    get_token(request)
    return JsonResponse({"authenticated": False})

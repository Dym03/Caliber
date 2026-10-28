import logging
from functools import wraps

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger(__name__)


def get_client_ip(request) -> str:
    """Extract client IP from HTTP headers (handling proxies/load balancers)."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR", "unknown")
    return ip or "unknown"


def _record_attempt(key: str, window_seconds: int) -> int:
    """Safely increment attempt counter in cache with timeout."""
    try:
        if cache.add(key, 1, timeout=window_seconds):
            return 1
        return cache.incr(key)
    except (ValueError, KeyError):
        count = (cache.get(key) or 0) + 1
        cache.set(key, count, timeout=window_seconds)
        return count


def rate_limit(
    action: str,
    max_requests: int = 5,
    window_seconds: int = 300,
    reset_on_success: bool = False,
    error_message: str | None = None,
):
    """
    Decorator for rate limiting views by client IP.
    
    :param action: Action name used in cache key (e.g. 'login', 'register')
    :param max_requests: Maximum allowed attempts in the time window
    :param window_seconds: Time window in seconds
    :param reset_on_success: If True, reset counter when view returns HTTP < 400 (e.g. login)
    :param error_message: Custom message returned in 429 response
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if not getattr(settings, "RATELIMIT_ENABLED", True):
                return view_func(request, *args, **kwargs)

            ip = get_client_ip(request)
            cache_key = f"caliber:ratelimit:{action}:{ip}"

            current_count = cache.get(cache_key, 0)
            if current_count >= max_requests:
                msg = (
                    error_message
                    or f"Příliš mnoho požadavků ({action}). Zkuste to prosím znovu za chvíli."
                )
                logger.warning(
                    f"Rate limit exceeded for action '{action}' from IP '{ip}' (count={current_count})"
                )
                return JsonResponse({"error": msg}, status=429)

            response = view_func(request, *args, **kwargs)

            if reset_on_success:
                if response.status_code < 400:
                    cache.delete(cache_key)
                else:
                    _record_attempt(cache_key, window_seconds)
            else:
                _record_attempt(cache_key, window_seconds)

            return response

        return wrapped

    return decorator


from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.middleware.csrf import get_token
from django.utils.translation import gettext as _

CSRF_TOKEN_HEADER_NAME = "X-CSRFToken"


class CsrfTokenMiddleware:
    """
    Add a CSRF Token to a response header
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        response = self.get_response(request)

        # Only add the CSRF token header if it's an api endpoint
        if not request.path_info.startswith("/api"):
            return response

        response[CSRF_TOKEN_HEADER_NAME] = get_token(request)
        return response


class SessionExpiredMiddleware:
    """
    Inspect the response and if it's a 403, check if the session has expired and return appropriate message
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        response = self.get_response(request)

        # Stop if response not 403
        if not response.status_code == 403:
            return response

        # Stop if not an API route
        if not request.path_info.startswith("/api"):
            return response

        # Stop if session cookie is present (not expired)
        if request.COOKIES.get(settings.SESSION_COOKIE_NAME):
            return response

        # Session cookie expired, show appropriate message
        return JsonResponse(
            {
                "detail": _("Your session has expired, please log in again."),
                "code": "session_expired",
            },
            status=403,
        )

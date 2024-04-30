from django.http import HttpRequest
from django.middleware.csrf import get_token

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

from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularJSONAPIView,
    SpectacularRedocView,
)

from openarchiefbeheer.accounts.api.views import ReviewersView

app_name = "api"


urlpatterns = [
    # API documentation
    path(
        "docs/",
        SpectacularRedocView.as_view(url_name="api:api-schema-json"),
        name="api-docs",
    ),
    path(
        "v1/",
        include(
            [
                path(
                    "",
                    SpectacularJSONAPIView.as_view(schema=None),
                    name="api-schema-json",
                ),
                path("schema", SpectacularAPIView.as_view(schema=None), name="schema"),
            ]
        ),
    ),
    # Authentication
    path(
        "v1/auth/",
        include(
            "openarchiefbeheer.api.authentication.urls", namespace="authentication"
        ),
    ),
    # Actual endpoints
    path(
        "v1/zaken/",
        include("openarchiefbeheer.api.zaken.urls", namespace="zaken"),
    ),
    path("v1/reviewers/", ReviewersView.as_view(), name="reviewers"),
]

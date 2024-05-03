from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularJSONAPIView,
    SpectacularRedocView,
)
from rest_framework import routers

from openarchiefbeheer.accounts.api.views import ReviewersView
from openarchiefbeheer.destruction.api.viewsets import DestructionListViewSet
from openarchiefbeheer.zaken.api.viewsets import ZakenViewSet

app_name = "api"

router = routers.DefaultRouter(trailing_slash=False)
router.register(r"destruction-lists", DestructionListViewSet)
router.register(r"zaken", ZakenViewSet, basename="zaken")


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
        "v1/",
        include(
            [
                path("reviewers/", ReviewersView.as_view(), name="reviewers"),
                path("", include(router.urls)),
            ]
        ),
    ),
]

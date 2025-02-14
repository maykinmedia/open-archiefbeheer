from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularJSONAPIView,
    SpectacularRedocView,
)
from rest_framework import routers

from openarchiefbeheer.accounts.api.views import UsersView, WhoAmIView
from openarchiefbeheer.config.api.views import (
    ArchiveConfigView,
    HealthCheckView,
    OIDCInfoView,
)
from openarchiefbeheer.destruction.api.views import ListStatusesListView
from openarchiefbeheer.destruction.api.viewsets import (
    CoReviewersViewSet,
    DestructionListCoReviewViewSet,
    DestructionListItemReviewViewSet,
    DestructionListItemsViewSet,
    DestructionListReviewViewSet,
    DestructionListViewSet,
    ReviewResponseViewSet,
)
from openarchiefbeheer.logging.api.viewsets import LogsViewset
from openarchiefbeheer.selection.api.views import (
    SelectionCountView,
    SelectionSelectAllView,
    SelectionView,
)
from openarchiefbeheer.zaken.api.views import (
    CacheZakenView,
    ExternalZaaktypenChoicesView,
    InformatieobjecttypeChoicesView,
    InternalZaaktypenChoicesView,
    ResultaattypeChoicesView,
    SelectielijstklasseChoicesView,
    StatustypeChoicesView,
)
from openarchiefbeheer.zaken.api.viewsets import ZakenViewSet

from .routers import BulkNestedRouter

app_name = "api"

router = routers.DefaultRouter()
router.register(r"destruction-lists", DestructionListViewSet)
router.register(
    r"destruction-list-items",
    DestructionListItemsViewSet,
    basename="destruction-list-items",
)
router.register(
    r"destruction-list-reviews",
    DestructionListReviewViewSet,
    basename="destruction-list-reviews",
)
router.register(
    r"review-items",
    DestructionListItemReviewViewSet,
    basename="reviews-items",
)
router.register(
    r"destruction-list-co-reviews",
    DestructionListCoReviewViewSet,
    basename="destruction-list-co-reviews",
)
router.register(
    r"review-responses",
    ReviewResponseViewSet,
    basename="review-responses",
)
router.register(r"zaken", ZakenViewSet, basename="zaken")
router.register(r"logs", LogsViewset, basename="logs")

destruction_list_router = BulkNestedRouter(
    router, r"destruction-lists", lookup="destruction_list"
)
destruction_list_router.register(
    r"co-reviewers", CoReviewersViewSet, basename="co-reviewers"
)


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
                path(
                    "users/",
                    UsersView.as_view(),
                    name="users",
                ),
                path("whoami/", WhoAmIView.as_view(), name="whoami"),
                path(
                    "destruction-list-statuses/",
                    ListStatusesListView.as_view(),
                    name="destruction-list-statuses",
                ),
                path(
                    "archive-config", ArchiveConfigView.as_view(), name="archive-config"
                ),
                path("oidc-info", OIDCInfoView.as_view(), name="oidc-info"),
                path("health-check", HealthCheckView.as_view(), name="health-check"),
                path(
                    "selections/<str:key>/", SelectionView.as_view(), name="selections"
                ),
                path(
                    "selections/<str:key>/count/",
                    SelectionCountView.as_view(),
                    name="selections-count",
                ),
                path(
                    "selections/<str:key>/select-all/",
                    SelectionSelectAllView.as_view(),
                    name="selections-select-all",
                ),
                path(
                    "_retrieve_zaken/", CacheZakenView.as_view(), name="retrieve-zaken"
                ),
                path(
                    "_zaaktypen-choices/",
                    InternalZaaktypenChoicesView.as_view(),
                    name="retrieve-zaaktypen-choices",
                ),
                path(
                    "_external-zaaktypen-choices/",
                    ExternalZaaktypenChoicesView.as_view(),
                    name="retrieve-external-zaaktypen-choices",
                ),
                path(
                    "_selectielijstklasse-choices/",
                    SelectielijstklasseChoicesView.as_view(),
                    name="retrieve-selectielijstklasse-choices",
                ),
                path(
                    "_statustype-choices/",
                    StatustypeChoicesView.as_view(),
                    name="retrieve-statustype-choices",
                ),
                path(
                    "_informatieobjecttype-choices/",
                    InformatieobjecttypeChoicesView.as_view(),
                    name="retrieve-informatieobjecttype-choices",
                ),
                path(
                    "_resultaattype-choices/",
                    ResultaattypeChoicesView.as_view(),
                    name="retrieve-resultaattype-choices",
                ),
                path("", include(router.urls)),
                path("", include(destruction_list_router.urls)),
            ]
        ),
    ),
]

from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from openarchiefbeheer.destruction.api.permissions import (
    CanCoReviewPermission,
    CanReviewPermission,
    CanStartDestructionPermission,
)
from openarchiefbeheer.utils.paginators import PageNumberPagination

from ..models import Zaak
from .filtersets import ZaakFilterBackend, ZaakFilterSet
from .serializers import ZaakSerializer


@extend_schema_view(
    list=extend_schema(
        summary=_("List zaken"),
        tags=["Zaken"],
        description=_("List cases retrieved and cached from Open Zaak."),
    ),
    search=extend_schema(
        tags=["Zaken"],
        summary=_("Search zaken"),
        description=_(
            "Search cases retrieved and cached from Open Zaak. "
            "You can use the same arguments in the JSON body as the query params of the 'List Zaken' endpoint "
        ),
    ),
)
class ZakenViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Zaak.objects.all().order_by("pk")
    serializer_class = ZaakSerializer
    permission_classes = [
        IsAuthenticated
        & (CanStartDestructionPermission | CanReviewPermission | CanCoReviewPermission)
    ]
    pagination_class = PageNumberPagination
    filter_backends = (ZaakFilterBackend, OrderingFilter)
    filterset_class = ZaakFilterSet
    ordering_fields = "__all__"

    @action(detail=False, methods=["post"], name="search")
    def search(self, request, *args, **kwargs) -> None:
        return self.list(request, *args, **kwargs)

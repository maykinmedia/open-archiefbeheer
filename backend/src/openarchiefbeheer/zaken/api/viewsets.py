from django.utils.translation import gettext_lazy as _

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from openarchiefbeheer.destruction.api.permissions import (
    CanReviewPermission,
    CanStartDestructionPermission,
)
from openarchiefbeheer.utils.paginators import PageNumberPagination

from ..models import Zaak
from .filtersets import ZaakFilter
from .serializers import ZaakSerializer


@extend_schema_view(
    list=extend_schema(
        summary=_("List zaken"),
        description=_("List cases retrieved and cached from Open Zaak."),
    ),
)
class ZakenViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Zaak.objects.all()
    serializer_class = ZaakSerializer
    permission_classes = [
        IsAuthenticated & (CanStartDestructionPermission | CanReviewPermission)
    ]
    pagination_class = PageNumberPagination
    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filterset_class = ZaakFilter
    ordering_fields = "__all__"

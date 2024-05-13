from django.utils.translation import gettext_lazy as _

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.pagination import LimitOffsetPagination as _LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated

from openarchiefbeheer.destruction.api.permissions import CanStartDestructionPermission

from ..models import Zaak
from .filtersets import ZaakFilter
from .serializers import ZaakSerializer


class LimitOffsetPagination(_LimitOffsetPagination):
    default_limit = 100


@extend_schema_view(
    list=extend_schema(
        summary=_("List zaken"),
        description=_("List cases retrieved and cached from Open Zaak."),
    ),
)
class ZakenViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Zaak.objects.all()
    serializer_class = ZaakSerializer
    permission_classes = [IsAuthenticated & CanStartDestructionPermission]
    pagination_class = LimitOffsetPagination
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ZaakFilter

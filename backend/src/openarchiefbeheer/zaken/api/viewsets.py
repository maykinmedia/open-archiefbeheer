from django.db.models import Q, QuerySet

from rest_framework import mixins, viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated

from openarchiefbeheer.destruction.api.permissions import CanStartDestructionPermission
from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.models import DestructionListItem

from ..models import Zaak
from .serializers import ZaakSerializer


class ZakenViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ZaakSerializer
    permission_classes = [IsAuthenticated & CanStartDestructionPermission]
    pagination_class = LimitOffsetPagination

    def get_queryset(self) -> QuerySet[Zaak]:
        zaken_to_exclude = DestructionListItem.objects.filter(
            ~Q(status=ListItemStatus.removed)
        ).values_list("zaak", flat=True)

        return Zaak.objects.exclude(data__url__in=list(zaken_to_exclude))

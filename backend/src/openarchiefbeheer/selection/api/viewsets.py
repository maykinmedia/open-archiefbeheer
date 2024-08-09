from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema_view
from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from openarchiefbeheer.selection.api.serializers import ZaakSelectionSerializer
from openarchiefbeheer.selection.models import ZaakSelection, ZaakSelectionItem
from openarchiefbeheer.zaken.models import Zaak

# TODO: Tests
# TODO: Schema view
@extend_schema_view()
# TODO: remove mixins.RetrieveModelMixin
class ZaakSelectionViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
                           viewsets.GenericViewSet):
    queryset = ZaakSelection.objects.all().select_related("last_updated_by").prefetch_related("items__zaak")
    serializer_class = ZaakSelectionSerializer
    # TODO: Improve permissions based on status and user (is the list selectable for the user in it's current state)
    permission_classes = (IsAuthenticated,)
    lookup_field = "slug"

    def retrieve(self, request, slug=None, *args, **kwargs):
        ZaakSelection.objects.get_or_create(slug=slug)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["PUT"], name="Add given zaken to zaak selection")
    def add_zaken(self, request, slug=None, **kwargs):
        instance = ZaakSelection.objects.get_or_create(slug=slug)[0]
        zaken = Zaak.objects.filter(url__in=request.data["zaken"])
        items = [ZaakSelectionItem(zaak_selection=instance, zaak=zaak, selected=True, detail=request.data["detail"]) for
                 zaak in zaken]
        ZaakSelectionItem.objects.bulk_create(items)

        instance.last_updated_by = self.request.user
        instance.save()

        return Response(status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["DELETE"], name="Remove given zaken from zaak selection")
    def remove_zaken(self, request, slug=None, **kwargs):
        instance = get_object_or_404(ZaakSelection, slug=slug)
        instance.items.filter(zaak__url__in=request.data["zaken"]).delete()

        instance.last_updated_by = self.request.user
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["DELETE"], name="Remove all zaken from zaak selection")
    def clear_zaken(self, request, slug=None):
        instance = get_object_or_404(ZaakSelection, slug=slug)
        instance.items.all().delete()

        instance.last_updated_by = self.request.user
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

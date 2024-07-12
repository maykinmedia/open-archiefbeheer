from rest_framework import serializers

from openarchiefbeheer.accounts.api.serializers import UserSerializer
from openarchiefbeheer.selection.models import ZaakSelection, ZaakSelectionItem


class ZaakSelectionItemSerializer(serializers.ModelSerializer):
    zaak = serializers.CharField(source='zaak.url')

    class Meta:
        model = ZaakSelectionItem
        fields = ("zaak", "selected", "detail")


class ZaakSelectionSerializer(serializers.ModelSerializer):
    last_updated_by = UserSerializer()
    items = ZaakSelectionItemSerializer(many=True)

    class Meta:
        model = ZaakSelection
        fields = ("slug", "last_updated", "last_updated_by", "items")
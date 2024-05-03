from rest_framework import serializers

from openarchiefbeheer.zaken.models import Zaak


class ZaakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zaak
        fields = ("data",)

    def to_representation(self, instance: Zaak) -> dict:
        serialized_zaak = super().to_representation(instance)
        return serialized_zaak["data"]

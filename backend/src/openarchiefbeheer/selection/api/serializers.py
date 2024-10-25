from rest_framework import serializers

from ..models import SelectionItem


class SelectionItemDataReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectionItem
        fields = ("selection_data",)

    def to_representation(self, data: dict) -> dict:
        representation = super().to_representation(data)
        return representation["selection_data"]


class SelectionSerializer(serializers.Serializer):
    key = serializers.CharField(required=True)

    def to_representation(self, data: dict) -> dict:
        iterable = SelectionItem.objects.filter(key=data["key"])
        child_serializer = SelectionItemDataReadSerializer()

        result = {}
        for item in iterable:
            result[item.zaak_url] = child_serializer.to_representation(item)
        return result

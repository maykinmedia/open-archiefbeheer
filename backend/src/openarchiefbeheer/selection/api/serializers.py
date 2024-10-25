from rest_framework import serializers

from ..models import SelectionItem


class SelectionItemDataReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectionItem
        fields = ("selection_data",)

    def to_representation(self, data: dict) -> dict:
        representation = super().to_representation(data)
        return representation["selection_data"]


class SelectionReadSerializer(serializers.Serializer):
    key = serializers.CharField(required=True)

    def to_representation(self, data: dict) -> dict:
        iterable = SelectionItem.objects.filter(key=data["key"])
        child_serializer = SelectionItemDataReadSerializer()

        result = {}
        for item in iterable:
            result[item.zaak_url] = child_serializer.to_representation(item)
        return result


class SelectionItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectionItem
        fields = (
            "key",
            "zaak_url",
            "selection_data",
        )


class SelectionWriteSerializer(serializers.ListSerializer):
    child = SelectionItemWriteSerializer()

    def to_internal_value(self, data: dict) -> list[dict]:
        internal_data = []
        selection_key = self.context["key"]
        for zaak_url, selection_data in data.items():
            internal_data.append(
                {
                    "key": selection_key,
                    "zaak_url": zaak_url,
                    "selection_data": selection_data,
                }
            )

        return super().to_internal_value(internal_data)

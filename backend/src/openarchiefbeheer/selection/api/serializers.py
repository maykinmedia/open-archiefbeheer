import sys

from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from ..models import AllSelectedToggle, SelectionItem
from .constants import MAX_SELECTION_DATA_SIZE


class SelectionItemDataReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelectionItem
        fields = ("selection_data",)

    def to_representation(self, data: dict) -> dict:
        representation = super().to_representation(data)
        return representation["selection_data"]


class SelectionReadSerializer(serializers.Serializer):
    key = serializers.CharField(required=True)

    def to_representation(self, queryset: QuerySet[SelectionItem]) -> dict:
        child_serializer = SelectionItemDataReadSerializer()

        result = {}
        for item in queryset:
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

    def validate_selection_data(self, value):
        if sys.getsizeof(value) > MAX_SELECTION_DATA_SIZE:
            raise ValidationError(
                _("Too much data passed, limit is %(max_size)s bytes")
                % {"max_size": MAX_SELECTION_DATA_SIZE}
            )
        return value


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

    def update(
        self, instances: QuerySet[SelectionItem], validated_data: list[dict]
    ) -> list[SelectionItem]:
        if self.partial:
            return self.partial_update(instances, validated_data)

        instances.delete()
        new_items = SelectionItem.objects.bulk_create(
            [SelectionItem(**item) for item in validated_data]
        )
        return new_items

    def partial_update(
        self, instances: QuerySet[SelectionItem], validated_data: list[dict]
    ) -> list[SelectionItem]:
        mapped_validated_data = {item["zaak_url"]: item for item in validated_data}
        zaak_urls = mapped_validated_data.keys()
        items_to_update = instances.filter(zaak_url__in=zaak_urls)

        updated_items = []
        for item in items_to_update:
            item_data = mapped_validated_data.pop(item.zaak_url)
            item.selection_data.update(item_data["selection_data"])
            updated_items.append(item)

        updated_items = SelectionItem.objects.bulk_update(
            updated_items, fields=["selection_data"]
        )

        items_to_create = [
            SelectionItem(**item) for _, item in mapped_validated_data.items()
        ]
        SelectionItem.objects.bulk_create(items_to_create)

        return SelectionItem.objects.filter(key=self.context["key"])


class SelectAllToggleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllSelectedToggle
        fields = ("all_selected",)

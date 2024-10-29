import sys

from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from ..models import SelectionItem
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
        zaak_urls = self.initial_data.keys()
        instances = instances.filter(zaak_url__in=zaak_urls)
        updated_items = []
        for instance in instances:
            # Use self.initial_data instead of self.validated_data, because the former is in form `{<zaak_url>: <selection_data>}`,
            # while the latter is in form `[{"zaak_url": "http://bla", "selection_data": {...}}]`.
            # WARNING: we have no validation of "selection_data" yet!!
            instance.selection_data.update(self.initial_data[instance.zaak_url])
            updated_items.append(instance)

        updated_items = SelectionItem.objects.bulk_update(
            updated_items, fields=["selection_data"]
        )
        return updated_items

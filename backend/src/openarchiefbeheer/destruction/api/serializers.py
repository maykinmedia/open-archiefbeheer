from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from openarchiefbeheer.accounts.api.serializers import UserSerializer

from ..constants import ListItemStatus
from ..models import DestructionList, DestructionListAssignee, DestructionListItem


class DestructionListAssigneeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestructionListAssignee
        fields = ("user", "order")


class DestructionListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestructionListItem
        fields = (
            "zaak",
            "extra_zaak_data",
        )

    def validate(self, attrs: dict) -> dict:
        if DestructionListItem.objects.filter(
            Q(~Q(status=ListItemStatus.removed), zaak=attrs["zaak"])
        ).exists():
            raise ValidationError(
                {
                    "zaak": _(
                        "This case was already included in another destruction list and was not exempt during the review process."
                    )
                }
            )

        return attrs


class DestructionListSerializer(serializers.ModelSerializer):
    assignees = DestructionListAssigneeSerializer(many=True)
    items = DestructionListItemSerializer(many=True)
    author = UserSerializer(read_only=True)

    class Meta:
        model = DestructionList
        fields = (
            "name",
            "author",
            "contains_sensitive_info",
            "assignees",
            "items",
        )

    def create(self, validated_data: dict) -> DestructionList:
        assignees_data = validated_data.pop("assignees")
        items_data = validated_data.pop("items")

        validated_data["author"] = self.context["request"].user
        destruction_list = DestructionList.objects.create(**validated_data)

        DestructionListItem.objects.bulk_create(
            [
                DestructionListItem(**{**item, "destruction_list": destruction_list})
                for item in items_data
            ]
        )
        DestructionListAssignee.objects.bulk_create(
            [
                DestructionListAssignee(
                    **{**assignee, "destruction_list": destruction_list}
                )
                for assignee in assignees_data
            ]
        )
        return destruction_list

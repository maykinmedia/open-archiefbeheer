from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from openarchiefbeheer.accounts.api.serializers import UserSerializer
from openarchiefbeheer.logging import logevent
from openarchiefbeheer.zaken.api.serializers import ZaakSerializer

from ..constants import ListItemStatus
from ..models import DestructionList, DestructionListAssignee, DestructionListItem


class DestructionListAssigneeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestructionListAssignee
        fields = ("user", "order")


class DestructionListAssigneeResponseSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = DestructionListAssignee
        fields = ("user", "order")


class DestructionListItemSerializer(serializers.ModelSerializer):
    zaak_data = serializers.SerializerMethodField(
        help_text=_(
            "If the case has not been deleted yet, this field contains all the zaak data."
        ),
        allow_null=True,
    )

    class Meta:
        model = DestructionListItem
        fields = (
            "zaak",
            "status",
            "extra_zaak_data",
            "zaak_data",
        )

    def validate(self, attrs: dict) -> dict:
        if DestructionListItem.objects.filter(
            Q(~Q(status=ListItemStatus.removed), zaak=attrs["zaak"])
        ).exists():
            raise ValidationError(
                {
                    "zaak": _(
                        "This case was already included in another destruction list and was not exempt during the "
                        "review process."
                    )
                }
            )

        return attrs

    @extend_schema_field(ZaakSerializer)
    def get_zaak_data(self, instance: DestructionListItem) -> dict | None:
        return instance.get_zaak_data()


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
            "status",
        )

    def create(self, validated_data: dict) -> DestructionList:
        assignees_data = validated_data.pop("assignees")
        items_data = validated_data.pop("items")

        author = self.context["request"].user
        validated_data["author"] = author
        destruction_list = DestructionList.objects.create(**validated_data)

        DestructionListItem.objects.bulk_create(
            [
                DestructionListItem(**{**item, "destruction_list": destruction_list})
                for item in items_data
            ]
        )
        assignees = DestructionListAssignee.objects.bulk_create(
            [
                DestructionListAssignee(
                    **{**assignee, "destruction_list": destruction_list}
                )
                for assignee in assignees_data
            ]
        )

        destruction_list.assign(assignees[0])

        logevent.destruction_list_created(destruction_list, author)

        return destruction_list


class DestructionListResponseSerializer(serializers.ModelSerializer):
    assignees = DestructionListAssigneeResponseSerializer(many=True)
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
            "status",
            "created",
            "status_changed",
        )

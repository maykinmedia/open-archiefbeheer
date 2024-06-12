from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.relations import SlugRelatedField

from openarchiefbeheer.accounts.api.serializers import UserSerializer
from openarchiefbeheer.logging import logevent
from openarchiefbeheer.zaken.api.serializers import ZaakSerializer

from ..constants import ListItemStatus, ReviewDecisionChoices
from ..models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
)


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
        destruction_list = self.context["destruction_list"]
        is_create = destruction_list is None

        filters = ~Q(status=ListItemStatus.removed) & Q(zaak=attrs["zaak"])
        if not is_create:
            filters = filters & ~Q(destruction_list=destruction_list)

        if DestructionListItem.objects.filter(filters).exists():
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
            "uuid",
            "name",
            "author",
            "contains_sensitive_info",
            "assignees",
            "items",
            "status",
        )
        extra_kwargs = {
            "uuid": {"read_only": True},
            "status": {"read_only": True},
            "author": {"read_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._context["destruction_list"] = self.instance

    def validate_assignees(
        self, assignees: list[DestructionListAssignee]
    ) -> list[DestructionListAssignee]:
        if len(assignees) != len(set([assignee["user"].pk for assignee in assignees])):
            raise ValidationError(
                _("The same user should not be selected as a reviewer more than once.")
            )
        return assignees

    def create(self, validated_data: dict) -> DestructionList:
        assignees_data = validated_data.pop("assignees")
        items_data = validated_data.pop("items")

        author = self.context["request"].user
        validated_data["author"] = author
        destruction_list = DestructionList.objects.create(**validated_data)

        destruction_list.bulk_create_items(items_data)
        assignees = destruction_list.bulk_create_assignees(assignees_data)

        destruction_list.assign(assignees[0])

        logevent.destruction_list_created(destruction_list, author)

        return destruction_list

    def update(
        self, instance: DestructionList, validated_data: dict
    ) -> DestructionList:
        assignees_data = validated_data.pop("assignees", None)
        items_data = validated_data.pop("items", None)

        instance.contains_sensitive_info = validated_data.pop(
            "contains_sensitive_info", instance.contains_sensitive_info
        )
        instance.name = validated_data.pop("name", instance.name)

        if items_data is not None:
            instance.items.all().delete()
            instance.bulk_create_items(items_data)

        if assignees_data is not None:
            instance.assignees.all().delete()
            instance.bulk_create_assignees(assignees_data)

        instance.save()

        logevent.destruction_list_updated(instance)
        return instance


class DestructionListResponseSerializer(serializers.ModelSerializer):
    assignees = DestructionListAssigneeResponseSerializer(many=True)
    items = DestructionListItemSerializer(many=True)
    author = UserSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)

    class Meta:
        model = DestructionList
        fields = (
            "uuid",
            "name",
            "author",
            "contains_sensitive_info",
            "assignees",
            "assignee",
            "items",
            "status",
            "created",
            "status_changed",
        )


class DestructionListItemReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestructionListItemReview
        fields = (
            "destruction_list_item",
            "feedback",
        )


class DestructionListReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    destruction_list = SlugRelatedField(
        slug_field="uuid", queryset=DestructionList.objects.all()
    )
    item_reviews = DestructionListItemReviewSerializer(
        many=True,
        required=False,
        help_text="This field is required if changes are requested to the destruction list.",
    )

    class Meta:
        model = DestructionListReview
        fields = (
            "destruction_list",
            "author",
            "decision",
            "list_feedback",
            "item_reviews",
        )

    def validate(self, attrs: dict) -> dict:
        destruction_list = attrs["destruction_list"]
        if destruction_list.assignee != self.context["request"].user:
            raise ValidationError(
                {
                    "author": _(
                        "This user is not currently assigned to the destruction list, "
                        "so they cannot create a review at this stage."
                    )
                }
            )

        if (
            attrs["decision"] == ReviewDecisionChoices.rejected
            and len(attrs.get("item_reviews", [])) == 0
        ):
            raise ValidationError(
                {
                    "item_reviews": _(
                        "This field cannot be empty if changes are requested on the list."
                    )
                }
            )

        if (
            attrs["decision"] == ReviewDecisionChoices.accepted
            and len(attrs.get("item_reviews", [])) != 0
        ):
            raise ValidationError(
                {
                    "item_reviews": _(
                        "There cannot be feedback on the cases if the list is approved."
                    )
                }
            )

        return attrs

    def create(self, validated_data: dict) -> DestructionListReview:
        item_reviews = validated_data.pop("item_reviews", [])

        validated_data["author"] = self.context["request"].user
        review = DestructionListReview.objects.create(**validated_data)

        extra_data_per_item = {
            "destruction_list": validated_data["destruction_list"],
            "review": review,
        }
        items_feedback_to_create = [
            DestructionListItemReview(**{**item, **extra_data_per_item})
            for item in item_reviews
        ]
        DestructionListItemReview.objects.bulk_create(items_feedback_to_create)

        return review

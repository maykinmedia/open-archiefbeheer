from django.db import transaction
from django.db.models import F, Q
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.relations import SlugRelatedField
from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.api.serializers import UserSerializer
from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.logging import logevent
from openarchiefbeheer.zaken.api.serializers import ZaakSerializer
from openarchiefbeheer.zaken.models import Zaak

from ..constants import (
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
)
from ..models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
    ReviewItemResponse,
    ReviewResponse,
)
from ..tasks import process_review_response


class ReviewerAssigneeListSerializer(serializers.ListSerializer):
    def validate(
        self, assignees: list[DestructionListAssignee]
    ) -> list[DestructionListAssignee]:
        if self.parent.instance:
            return assignees

        assignees_pks = [assignee["user"].pk for assignee in assignees]

        if len(assignees) != len(set(assignees_pks)):
            raise ValidationError(
                _("The same user should not be selected as a reviewer more than once.")
            )

        author = self.parent.context["request"].user
        if author.pk in assignees_pks:
            raise ValidationError(_("The author of a list cannot also be a reviewer."))

        return assignees


class ReviewerAssigneeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestructionListAssignee
        fields = ("user",)
        list_serializer_class = ReviewerAssigneeListSerializer


class ListFinalisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestructionListAssignee
        fields = ("user", "destruction_list", "role", "comment")
        
    def validate(self, attrs: dict) -> dict:
        # we need to check if the user is a archivist
        if not self.context["request"].user.role.can_review_final_list:
            raise ValidationError(
                _("Only archivists can finalise a destruction list.")
            )
        return attrs
    


class DestructionListAssigneeResponseSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = DestructionListAssignee
        fields = ("user",)


class ReassignementSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True, allow_blank=False)
    role = serializers.ChoiceField(choices=ListRole.choices)
    assignees = ReviewerAssigneeSerializer(many=True)

    def validate(self, attrs):
        destruction_list = self.context["destruction_list"]
        if (
            attrs["role"] == ListRole.reviewer
            and not destruction_list.has_short_review_process()
            and len(attrs["assignees"]) < 2
        ):
            raise ValidationError(
                _(
                    "A destruction list without a short reviewing process must have more than 1 reviewer."
                )
            )

        return attrs


class DestructionListItemWriteSerializer(serializers.ModelSerializer):
    zaak = serializers.SlugRelatedField(slug_field="url", queryset=Zaak.objects.all())

    class Meta:
        model = DestructionListItem
        fields = (
            "pk",
            "status",
            "extra_zaak_data",
            "zaak",
            "processing_status",
        )

    def validate(self, attrs: dict) -> dict:
        destruction_list = self.context["destruction_list"]
        is_create = destruction_list is None

        filters = ~Q(status=ListItemStatus.removed) & Q(zaak__url=attrs["zaak"].url)
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


class DestructionListItemReadSerializer(serializers.ModelSerializer):
    zaak = ZaakSerializer(allow_null=True, read_only=True)

    class Meta:
        model = DestructionListItem
        fields = (
            "pk",
            "status",
            "extra_zaak_data",
            "zaak",
            "processing_status",
        )


class DestructionListSerializer(serializers.ModelSerializer):
    assignees = ReviewerAssigneeSerializer(many=True, required=False)
    items = DestructionListItemWriteSerializer(many=True)
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

    def validate(self, attrs: dict) -> dict:
        assignees = attrs.get("assignees")
        if not assignees:
            return attrs

        if len(assignees) > 1:
            return attrs

        zaken_urls = [i["zaak"].url for i in attrs["items"]]
        zaaktypes_urls = (
            Zaak.objects.filter(url__in=zaken_urls)
            .values_list("zaaktype", flat=True)
            .distinct()
        )
        config = ArchiveConfig.get_solo()

        if not all(
            [zaaktype in config.zaaktypes_short_process for zaaktype in zaaktypes_urls]
        ):
            raise ValidationError(
                _(
                    "A destruction list without a short reviewing process must have more than 1 reviewer."
                )
            )

        return attrs

    def create(self, validated_data: dict) -> DestructionList:
        assignees_data = validated_data.pop("assignees")
        items_data = validated_data.pop("items")

        author = self.context["request"].user
        validated_data["author"] = author
        validated_data["assignee"] = author
        validated_data["status"] = ListStatus.new
        destruction_list = DestructionList.objects.create(**validated_data)
        destruction_list.bulk_create_items(items_data)

        # Create an assignee also for the author
        DestructionListAssignee.objects.create(
            user=author, destruction_list=destruction_list, role=ListRole.author
        )
        destruction_list.bulk_create_assignees(assignees_data, role=ListRole.reviewer)

        logevent.destruction_list_created(destruction_list, author)

        return destruction_list

    def update(
        self, instance: DestructionList, validated_data: dict
    ) -> DestructionList:
        user = self.context["request"].user
        validated_data.pop("assignees", None)
        items_data = validated_data.pop("items", None)
        instance.contains_sensitive_info = validated_data.pop(
            "contains_sensitive_info", instance.contains_sensitive_info
        )
        instance.name = validated_data.pop("name", instance.name)

        if items_data is not None:
            instance.items.all().delete()
            instance.bulk_create_items(items_data)

        instance.save()

        logevent.destruction_list_updated(instance, user)
        return instance


class DestructionListAPIResponseSerializer(serializers.ModelSerializer):
    assignees = DestructionListAssigneeResponseSerializer(many=True)
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
            "status",
            "processing_status",
            "created",
            "status_changed",
        )


class ZakenReviewSerializer(serializers.Serializer):
    zaak_url = serializers.URLField(
        required=True, help_text="The URL of the case for which changes are requested."
    )
    feedback = serializers.CharField(
        required=True, help_text="Feedback about what should be done with this case."
    )


class DestructionListReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    destruction_list = SlugRelatedField(
        slug_field="uuid", queryset=DestructionList.objects.all()
    )
    zaken_reviews = ZakenReviewSerializer(
        many=True,
        required=False,
        help_text="This field is required if changes are requested to the destruction list.",
    )

    class Meta:
        model = DestructionListReview
        fields = (
            "pk",
            "destruction_list",
            "author",
            "decision",
            "list_feedback",
            "zaken_reviews",
            "created",
        )

    def validate(self, attrs: dict) -> dict:
        destruction_list = attrs["destruction_list"]
        user = self.context["request"].user

        # User is not assigned
        if destruction_list.assignee != user:
            raise ValidationError(
                {
                    "author": _(
                        "This user is not currently assigned to the destruction list, "
                        "so they cannot create a review at this stage."
                    )
                }
            )

        # User is not permitted based on role + status
        if (
            (
                destruction_list.status == ListStatus.ready_to_review
                and not user.role.can_review_destruction
            )
            or (
                destruction_list.status == ListStatus.ready_for_archivist
                and not user.role.can_review_final_list
            )
            or destruction_list.status
            not in [ListStatus.ready_to_review, ListStatus.ready_for_archivist]
        ):
            raise ValidationError(
                {
                    "author": _(
                        "The status of this destruction list prevents you from creating a review at this stage."
                    )
                }
            )

        zaken_reviews = attrs.get("zaken_reviews", [])
        if (
            attrs["decision"] == ReviewDecisionChoices.rejected
            and len(zaken_reviews) == 0
        ):
            raise ValidationError(
                {
                    "zaken_reviews": _(
                        "This field cannot be empty if changes are requested on the list."
                    )
                }
            )

        if (
            attrs["decision"] == ReviewDecisionChoices.accepted
            and len(zaken_reviews) != 0
        ):
            raise ValidationError(
                {
                    "zaken_reviews": _(
                        "There cannot be feedback on the cases if the list is approved."
                    )
                }
            )

        if len(zaken_reviews) > 0:
            destruction_list_items = (
                attrs["destruction_list"]
                .items.filter(status=ListItemStatus.suggested)
                .select_related("zaak")
                .values_list("zaak__url", flat=True)
            )

            for zaak_review in zaken_reviews:
                if zaak_review["zaak_url"] not in destruction_list_items:
                    raise ValidationError(
                        {
                            "zaken_reviews": _(
                                "You can only provide feedback about cases that are part of the destruction list."
                            )
                        }
                    )

        return attrs

    def create(self, validated_data: dict) -> DestructionListReview:
        zaken_reviews = validated_data.pop("zaken_reviews", [])
        destruction_list_items_with_changes = (
            validated_data["destruction_list"]
            .items.select_related("zaak")
            .filter(
                zaak__url__in=[zaak_review["zaak_url"] for zaak_review in zaken_reviews]
            )
            .distinct("zaak__url")
            .annotate(zaak_url=F("zaak__url"))
        )

        validated_data["author"] = self.context["request"].user
        review = DestructionListReview.objects.create(**validated_data)

        review_items_data = [
            DestructionListItemReview(
                **{
                    "destruction_list_item": destruction_list_items_with_changes.get(
                        zaak_url=zaak_review["zaak_url"]
                    ),
                    "destruction_list": validated_data["destruction_list"],
                    "review": review,
                    "feedback": zaak_review["feedback"],
                }
            )
            for zaak_review in zaken_reviews
        ]
        DestructionListItemReview.objects.bulk_create(review_items_data)

        validated_data["destruction_list"].assign_next()

        logevent.destruction_list_reviewed(
            destruction_list=validated_data["destruction_list"],
            review=review,
            user=review.author,
        )

        return review


class DestructionListItemReviewSerializer(serializers.ModelSerializer):
    zaak = serializers.SerializerMethodField(
        help_text=_(
            "In the case that the zaak has already been deleted, only the URL field will be returned."
        )
    )

    class Meta:
        model = DestructionListItemReview
        fields = ("pk", "zaak", "feedback")

    @extend_schema_field(ZaakSerializer)
    def get_zaak(self, obj) -> dict | None:
        zaak = obj.destruction_list_item.zaak
        # The zaak is no longer present in the cache,
        # it might have already been removed
        if not zaak:
            return None

        serializer = ZaakSerializer(instance=zaak)
        return serializer.data


class ActionZaakSerializer(serializers.Serializer):
    selectielijstklasse = serializers.URLField(
        required=False,
        help_text=_("The URL of to a 'resultaat' resource from the selectielijst API."),
    )
    archiefactiedatum = serializers.DateField(
        required=False, help_text=_("A new date for when this case should be archived.")
    )

    def to_internal_value(self, data: dict) -> dict:
        internal_value = super().to_internal_value(data)

        if archiefactiedatum := internal_value.get("archiefactiedatum"):
            internal_value["archiefactiedatum"] = archiefactiedatum.isoformat()
        return internal_value


class ReviewItemResponseSerializer(serializers.ModelSerializer):
    action_zaak = ActionZaakSerializer(required=False)

    class Meta:
        model = ReviewItemResponse
        fields = (
            "pk",
            "review_item",
            "action_item",
            "action_zaak",
            "created",
            "comment",
        )


class ReviewResponseSerializer(serializers.ModelSerializer):
    items_responses = ReviewItemResponseSerializer(many=True)

    class Meta:
        model = ReviewResponse
        fields = ("pk", "review", "comment", "created", "items_responses")

    def validate(self, attrs: dict) -> dict:
        destruction_list = attrs["review"].destruction_list
        request = self.context["request"]

        if not (
            request.user == destruction_list.author
            and destruction_list.status == ListStatus.changes_requested
        ):
            raise ValidationError(
                _(
                    "This user is either not allowed to update the destruction list or "
                    "the destruction list cannot currently be updated."
                )
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data: dict) -> ReviewResponse:
        items_responses_data = validated_data.pop("items_responses", [])
        items_responses = [
            ReviewItemResponse(processing_status=InternalStatus.queued, **item_response)
            for item_response in items_responses_data
        ]

        review_response = ReviewResponse.objects.create(**validated_data)
        ReviewItemResponse.objects.bulk_create(items_responses)

        process_review_response.delay(review_response.pk)

        return review_response


class AuditTrailItemSerializer(serializers.ModelSerializer):
    message = serializers.CharField(source="get_message")
    user = UserSerializer()

    class Meta:
        model = TimelineLog
        fields = (
            "pk",
            "timestamp",
            "user",
            "message",
            "extra_data",
        )

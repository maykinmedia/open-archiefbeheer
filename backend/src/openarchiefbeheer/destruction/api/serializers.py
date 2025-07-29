from typing import Any, Iterable

from django.db import transaction
from django.db.models import F, Q, QuerySet
from django.utils.translation import gettext_lazy as _

from drf_spectacular.plumbing import build_basic_type
from drf_spectacular.utils import OpenApiTypes, extend_schema_field
from requests.exceptions import HTTPError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.relations import SlugRelatedField

from openarchiefbeheer.accounts.api.serializers import UserSerializer
from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.logging import logevent
from openarchiefbeheer.zaken.api.filtersets import ZaakFilterSet
from openarchiefbeheer.zaken.api.serializers import ZaakSerializer
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.utils import retrieve_selectielijstklasse_resultaat

from ..api.constants import MAX_NUMBER_CO_REVIEWERS
from ..constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
    ZaakActionType,
)
from ..models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListCoReview,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
    ReviewItemResponse,
    ReviewResponse,
)
from ..signals import co_reviewers_added
from ..tasks import process_review_response


class ReviewerAssigneeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestructionListAssignee
        fields = ("user",)

    def validate_user(self, user: User) -> User:
        if not user.has_perm("accounts.can_review_destruction"):
            raise ValidationError(
                _(
                    "The chosen user does not have the permission of reviewing a destruction list."
                )
            )
        return user

    def validate(self, attrs: dict) -> dict:
        if self.parent.instance:
            return attrs

        if destruction_list := self.parent.context.get("destruction_list"):
            # Case in which an existing reviewer is replaced
            author = destruction_list.author
        else:
            # Case in which a new list is created
            author = self.parent.context["request"].user

        if author.pk == attrs["user"].pk:
            raise ValidationError(
                {"user": _("The author of a list cannot also be a reviewer.")}
            )

        return attrs


class CoReviewerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestructionListAssignee
        fields = ("user",)

    def validate_user(self, user: User) -> User:
        if not user.has_perm("accounts.can_co_review_destruction"):
            raise ValidationError(
                _(
                    "The chosen user does not have the permission to co-review a destruction list."
                )
            )
        return user

    def validate(self, attrs: dict) -> dict:
        if self.parent.instance:
            return attrs

        destruction_list = self.context["destruction_list"]
        main_reviewer = destruction_list.assignees.get(role=ListRole.main_reviewer)
        if main_reviewer.user.pk == attrs["user"].pk:
            raise ValidationError(
                {"user": _("The main reviewer cannot also be a co-reviewer.")}
            )

        if destruction_list.author.pk == attrs["user"].pk:
            raise ValidationError(
                {"user": _("The author of a list cannot be assigned as a co-reviewer.")}
            )

        return attrs


class CoReviewerAssignmentSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True, allow_blank=False)
    add = CoReviewerSerializer(many=True)
    remove = CoReviewerSerializer(many=True, required=False)

    def to_representation(self, instance):
        read_serializer = DestructionListAssigneeReadSerializer(
            instance=instance, many=True
        )
        return read_serializer.data

    def validate(self, attrs):
        current_number_co_reviewers = (
            self.context["destruction_list"]
            .assignees.filter(role=ListRole.co_reviewer)
            .count()
        )

        # (New) number of co reviewers depends on whether a partial update has been mode or a full update is provided.
        number_of_co_reviewers = (
            (
                current_number_co_reviewers
                + len(attrs.get("add", []))
                - len(attrs.get("remove", []))
            )
            if self.partial
            else len(attrs.get("add", []))
        )

        if number_of_co_reviewers > MAX_NUMBER_CO_REVIEWERS:
            raise ValidationError(
                _("The maximum number of allowed co-reviewers is %(max_co_reviewers)s.")
                % {"max_co_reviewers": MAX_NUMBER_CO_REVIEWERS}
            )
        return attrs

    def update(
        self, instance: QuerySet[DestructionListAssignee], validated_data: dict
    ) -> QuerySet[DestructionListAssignee]:
        destruction_list = self.context["destruction_list"]
        if not self.partial:
            instance.delete()

        new_co_reviewers = validated_data.get("add", [])
        co_reviewers_to_remove = validated_data.get("remove", [])

        new_assignees = [
            DestructionListAssignee(
                user=co_reviewer["user"],
                destruction_list=destruction_list,
                role=ListRole.co_reviewer,
            )
            for co_reviewer in new_co_reviewers
        ]

        if self.partial:
            instance.filter(
                user__in=[
                    co_reviewer["user"] for co_reviewer in co_reviewers_to_remove
                ],
            ).delete()

        new_assignees = DestructionListAssignee.objects.bulk_create(new_assignees)

        return destruction_list.assignees.filter(role=ListRole.co_reviewer)

    def save(self, **kwargs):
        instance = super().save(**kwargs)

        common_params = {
            "destruction_list": self.context["destruction_list"],
            "partial": self.partial,
            "user": self.context["request"].user,
            "comment": self.validated_data["comment"],
        }

        co_reviewers_added.send(
            sender=self.context["destruction_list"],
            **{
                **common_params,
                "added_co_reviewers": self.validated_data["add"],
            },
        )
        logevent.destruction_list_co_reviewers_added(
            **{
                **common_params,
                "co_reviewers": (
                    self.context["destruction_list"]
                    .assignees.filter(role=ListRole.co_reviewer)
                    .order_by("user__username")
                ),
            }
        )

        return instance


class MarkAsFinalSerializer(serializers.Serializer):
    comment = serializers.CharField(allow_blank=True)
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all().prefetch_related("user_permissions")
    )

    def validate_user(self, user: User) -> User:
        if not user.has_perm("accounts.can_review_final_list"):
            raise ValidationError(
                _(
                    "The chosen user does not have the permission to review a final list."
                )
            )

        return user


class DestructionListAssigneeReadSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = DestructionListAssignee
        fields = ("user", "role")


class ReassignementSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True, allow_blank=False)
    assignee = ReviewerAssigneeSerializer()


class DestructionListItemWriteSerializer(serializers.ModelSerializer):
    zaak = serializers.SlugRelatedField(slug_field="url", queryset=Zaak.objects.all())

    class Meta:
        model = DestructionListItem
        fields = (
            "pk",
            "status",
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
    review_advice_ignored = serializers.SerializerMethodField(
        help_text=_(
            "Specifies whether the record manager went against"
            " the advice of a reviewer when processing the last review."
        ),
        allow_null=True,
    )
    review_response_comment = serializers.SerializerMethodField(
        help_text=_(
            "Specifies the reason why the record manager went against"
            " the advice of a reviewer when processing the last review."
        ),
        allow_null=True,
    )

    class Meta:
        model = DestructionListItem
        fields = (
            "pk",
            "status",
            "extra_zaak_data",
            "zaak",
            "processing_status",
            "review_advice_ignored",
            "review_response_comment",
        )

    @extend_schema_field(build_basic_type(OpenApiTypes.BOOL))
    def get_review_advice_ignored(self, item: DestructionListItem) -> bool | None:
        if hasattr(item, "review_advice_ignored"):
            return item.review_advice_ignored

        if item.destruction_list.status != ListStatus.ready_to_review:
            return None

        last_review_response = (
            ReviewItemResponse.objects.filter(review_item__destruction_list_item=item)
            .order_by("-created")
            .last()
        )
        if last_review_response is None:
            return

        return last_review_response.action_item == DestructionListItemAction.keep

    @extend_schema_field(build_basic_type(OpenApiTypes.STR))
    def get_review_response_comment(self, item: DestructionListItem) -> str:
        if hasattr(item, "last_review_comment"):
            return item.last_review_comment

        if item.destruction_list.status != ListStatus.ready_to_review:
            return ""

        last_review_response = (
            ReviewItemResponse.objects.filter(review_item__destruction_list_item=item)
            .order_by("-created")
            .last()
        )
        if last_review_response is None:
            return ""

        return last_review_response.comment


class DestructionListWriteSerializer(serializers.ModelSerializer):
    add = DestructionListItemWriteSerializer(many=True, required=False)
    remove = DestructionListItemWriteSerializer(many=True, required=False)
    reviewer = ReviewerAssigneeSerializer(required=False)
    author = UserSerializer(read_only=True)
    select_all = serializers.BooleanField(
        required=False,
        help_text=_(
            "Option to bulk select cases. Adds all the cases corresponding to the given filters to the list."
        ),
    )
    zaak_filters = serializers.JSONField(
        required=False,
        help_text=_(
            "If the option to bulk select cases is enabled, these filters are used to select the right cases."
        ),
    )

    class Meta:
        model = DestructionList
        fields = (
            "add",
            "remove",
            "uuid",
            "name",
            "author",
            "comment",
            "contains_sensitive_info",
            "reviewer",
            "status",
            "select_all",
            "zaak_filters",
        )
        extra_kwargs = {
            "uuid": {"read_only": True},
            "status": {"read_only": True},
            "author": {"read_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._context["destruction_list"] = self.instance

    def validate_zaak_filters(self, value: Any) -> dict:
        if not isinstance(value, dict):
            raise ValidationError("Should be a JSON object.")

        filterset = ZaakFilterSet(data=value)
        if not filterset.is_valid():
            raise ValidationError("Invalid filter(s).")

        return value

    def validate(self, attrs: dict) -> dict:
        if (attrs.get("add") or attrs.get("remove")) and attrs.get("select_all"):
            raise ValidationError(
                "'add' or 'remove' cannot be combined with 'select_all'",
                code="invalid",
            )

        if not self.instance and not attrs.get("add") and not attrs.get("select_all"):
            raise ValidationError(
                "Neither the 'add' nor the 'select_all' field have been specified.",
                code="invalid",
            )

        if not self.instance and not attrs.get("reviewer"):
            raise ValidationError(
                "Selecting a reviewer is required for creating a list.",
                code="invalid",
            )

        return attrs

    def _get_zaken(
        self, zaak_filters: dict, items: list[dict], bulk_select: bool
    ) -> Iterable[Zaak]:
        if bulk_select:
            zaak_filters.update({"not_in_destruction_list": True})
            filterset = ZaakFilterSet(data=zaak_filters)
            filterset.is_valid()

            zaken = filterset.qs
        else:
            zaken = [item["zaak"] for item in items]

        return zaken

    def create(self, validated_data: dict) -> DestructionList:
        reviewer_data = validated_data.pop("reviewer")
        add = validated_data.pop("add", [])
        bulk_select = validated_data.pop("select_all", False)
        zaak_filters = validated_data.pop("zaak_filters", {})

        author = self.context["request"].user
        validated_data["author"] = author
        validated_data["assignee"] = author
        validated_data["status"] = ListStatus.new
        destruction_list = DestructionList.objects.create(**validated_data)

        zaken = self._get_zaken(zaak_filters, add, bulk_select)
        destruction_list.add_items(zaken)

        # Create an assignee also for the author
        DestructionListAssignee.objects.create(
            user=author, destruction_list=destruction_list, role=ListRole.author
        )
        DestructionListAssignee.objects.create(
            user=reviewer_data["user"],
            destruction_list=destruction_list,
            role=ListRole.main_reviewer,
        )

        logevent.destruction_list_created(
            destruction_list, author, reviewer_data["user"]
        )
        return destruction_list

    def update(
        self, instance: DestructionList, validated_data: dict
    ) -> DestructionList:
        user = self.context["request"].user
        validated_data.pop("reviewer", None)
        add_data = validated_data.pop("add", [])
        remove_data = validated_data.pop("remove", [])
        instance.contains_sensitive_info = validated_data.pop(
            "contains_sensitive_info", instance.contains_sensitive_info
        )
        bulk_select = validated_data.pop("select_all", False)
        zaak_filters = validated_data.pop("zaak_filters", {})

        instance.name = validated_data.pop("name", instance.name)

        if add_data or bulk_select:
            zaken = self._get_zaken(zaak_filters, add_data, bulk_select)
            self.instance.add_items(zaken, True)

        if remove_data:
            zaken = [item["zaak"] for item in remove_data]
            self.instance.remove_items(zaken)

        instance.save()

        logevent.destruction_list_updated(instance, user)
        return instance


class DestructionListReadSerializer(serializers.ModelSerializer):
    assignees = DestructionListAssigneeReadSerializer(many=True)
    author = UserSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    deletable_items_count = serializers.SerializerMethodField(
        help_text=_("Number of items to be deleted"),
        allow_null=True,
    )

    class Meta:
        model = DestructionList
        fields = (
            "uuid",
            "name",
            "author",
            "comment",
            "contains_sensitive_info",
            "assignees",
            "assignee",
            "status",
            "processing_status",
            "created",
            "status_changed",
            "planned_destruction_date",
            "deletable_items_count",
        )

    def get_deletable_items_count(self, instance: DestructionList) -> int:
        succeeded_count = instance.items.filter(
            processing_status=InternalStatus.succeeded
        ).count()
        total_count = instance.items.filter(status=ListItemStatus.suggested).count()
        return total_count - succeeded_count


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
        # TODO: in v2 make list_feedback required.
        # extra_kwargs = {
        #     "list_feedback": {
        #         "required": True,
        #     }
        # }

    def validate(self, attrs: dict) -> dict:
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
            comment=validated_data.get("list_feedback", ""),
        )

        return review


class DestructionListItemReviewSerializer(serializers.ModelSerializer):
    zaak = serializers.SerializerMethodField(
        help_text=_(
            "In the case that the zaak has already been deleted, this field will be null."
        ),
        allow_null=True,
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


class DestructionListCoReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    destruction_list = SlugRelatedField(
        slug_field="uuid", queryset=DestructionList.objects.all()
    )
    list_feedback = serializers.CharField(required=True)

    class Meta:
        model = DestructionListCoReview
        fields = (
            "pk",
            "destruction_list",
            "author",
            "list_feedback",
            "created",
        )

    def create(self, validated_data: dict) -> DestructionListReview:
        user = self.context["request"].user
        validated_data.update({"author": user})

        co_review = super().create(validated_data)
        logevent.destruction_list_co_reviewed(
            destruction_list=validated_data["destruction_list"],
            co_review=co_review,
            user=user,
        )
        return co_review


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
    review_item = serializers.PrimaryKeyRelatedField(
        queryset=DestructionListItemReview.objects.all().select_related(
            "destruction_list_item__zaak"
        ),
    )
    action_zaak = ActionZaakSerializer(required=False)

    class Meta:
        model = ReviewItemResponse
        fields = (
            "pk",
            "review_item",
            "action_item",
            "action_zaak_type",
            "action_zaak",
            "created",
            "comment",
        )

    def _get_selectielijst_resultaat(self, resultaat_url: str) -> dict:
        try:
            resultaat = retrieve_selectielijstklasse_resultaat(resultaat_url)
        except HTTPError:
            raise ValidationError(
                _(
                    "Could not validate the selectielijstklasse waardering "
                    "due to an unexpected response from the Selectielijst API."
                )
            )

        return resultaat

    def _validate_action_zaak_with_type(
        self,
        action_zaak: dict,
        action_zaak_type: str,
        review_item: DestructionListItemReview,
    ) -> None:
        # TODO this could be refactored using a polymorphic serializer
        selectielijstklasse = action_zaak.get("selectielijstklasse")
        archiefactiedatum = action_zaak.get("archiefactiedatum")

        match action_zaak_type:
            case ZaakActionType.selectielijstklasse_and_bewaartermijn:
                if not selectielijstklasse:
                    raise ValidationError(
                        {
                            "selectielijstklasse": _(
                                "The selectielijstklasse is required for action type "
                                "is 'selectielijstklasse_and_bewaartermijn'."
                            )
                        }
                    )

                resultaat = self._get_selectielijst_resultaat(selectielijstklasse)
                if resultaat["waardering"] == "blijvend_bewaren" and archiefactiedatum:
                    raise ValidationError(
                        {
                            "selectielijstklasse": _(
                                "The selectielijstklasse has waardering 'blijvend_bewaren', "
                                "so the archiefactiedatum should be null."
                            )
                        }
                    )

            case ZaakActionType.bewaartermijn:
                if selectielijstklasse:
                    raise ValidationError(
                        {
                            "action_zaak_type": _(
                                "The selectielijstklasse cannot be changed if the case action type is 'bewaartermijn'."
                            )
                        }
                    )

                # If no selectielijstklasse is specified on the zaak, allow updating
                # the archiefactiedatum manually
                if not review_item.destruction_list_item.zaak.selectielijstklasse:
                    return

                resultaat = self._get_selectielijst_resultaat(
                    review_item.destruction_list_item.zaak.selectielijstklasse
                )
                if resultaat["waardering"] == "blijvend_bewaren":
                    raise ValidationError(
                        {
                            "archiefactiedatum": _(
                                "The selectielijstklasse has waardering 'blijvend_bewaren', "
                                "so an archiefactiedatum cannot be set."
                            )
                        }
                    )

    def validate(self, attrs: dict) -> dict:
        action_zaak = attrs.get("action_zaak", {})
        action_zaak_type = attrs.get("action_zaak_type", {})

        if attrs["action_item"] == DestructionListItemAction.keep and action_zaak:
            raise ValidationError(
                {
                    "action_zaak": _(
                        "The case cannot be changed if it is kept in the destruction list."
                    )
                }
            )

        if attrs["action_item"] == DestructionListItemAction.remove:
            if not action_zaak_type or not action_zaak:
                raise ValidationError(
                    _(
                        "When removing an item from a destruction list, "
                        "the fields action_zaak_type and action_zaak are required."
                    )
                )

            self._validate_action_zaak_with_type(
                action_zaak, action_zaak_type, attrs["review_item"]
            )

        return attrs


class ReviewResponseSerializer(serializers.ModelSerializer):
    items_responses = ReviewItemResponseSerializer(many=True)

    class Meta:
        model = ReviewResponse
        fields = ("pk", "review", "comment", "created", "items_responses")

    def validate(self, attrs: dict) -> dict:
        destruction_list = attrs["review"].destruction_list

        if not (destruction_list.status == ListStatus.changes_requested):
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

        logevent.destruction_list_review_response_created(
            validated_data["review"].destruction_list, self.context["request"].user
        )

        process_review_response.delay(review_response.pk)

        return review_response


class AbortDestructionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True, allow_blank=False)

    def save(self):
        status = self.instance.status
        self.instance.abort_destruction()

        logevent.destruction_list_aborted(
            self.instance,
            self.validated_data["comment"],
            self.context["request"].user,
            abort_destruction=status == ListStatus.ready_to_delete,
        )
        return self.instance

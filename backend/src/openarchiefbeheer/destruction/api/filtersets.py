from django.db.models import Case, QuerySet, Value, When
from django.utils.translation import gettext_lazy as _

from django_filters import FilterSet, NumberFilter, OrderingFilter, UUIDFilter

from ..constants import InternalStatus
from ..models import (
    DestructionList,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
    ReviewResponse,
)


class DestructionListItemFilterset(FilterSet):
    destruction_list = UUIDFilter(
        field_name="destruction_list",
        method="filter_in_destruction_list",
        help_text=_(
            "Retrieve the items that are in a destruction list and "
            "order them based on processing status."
        ),
    )

    class Meta:
        model = DestructionListItem
        fields = ("destruction_list", "status", "processing_status")

    def filter_in_destruction_list(
        self, queryset: QuerySet[DestructionListItem], name: str, value: str
    ) -> QuerySet[DestructionListItem]:
        return (
            queryset.filter(destruction_list__uuid=value)
            .annotate(
                processing_status_index=Case(
                    When(processing_status=InternalStatus.failed, then=Value(1)),
                    When(processing_status=InternalStatus.processing, then=Value(2)),
                    When(processing_status=InternalStatus.queued, then=Value(3)),
                    When(processing_status=InternalStatus.new, then=Value(4)),
                    When(processing_status=InternalStatus.succeeded, then=Value(5)),
                    default=Value(1),
                ),
            )
            .order_by("processing_status_index")
        )


class DestructionListFilterset(FilterSet):
    assignee = NumberFilter(
        field_name="assignee",
        help_text="The pk of the user currently assigned to the list.",
    )

    class Meta:
        model = DestructionList
        fields = ("assignee",)


class DestructionListReviewFilterset(FilterSet):
    destruction_list__uuid = UUIDFilter(
        field_name="destruction_list__uuid",
        help_text="The UUID of the destruction list.",
        method="filter_destruction_list_uuid",
    )
    ordering = OrderingFilter(fields=("created", "created"))

    class Meta:
        model = DestructionListReview
        fields = ("destruction_list", "destruction_list__uuid", "decision", "ordering")

    def filter_destruction_list_uuid(
        self, queryset: QuerySet[DestructionListReview], name: str, value: str
    ):
        return queryset.filter(destruction_list__uuid=value)


class DestructionListReviewItemFilterset(FilterSet):
    class Meta:
        model = DestructionListItemReview
        fields = ("review",)


class ReviewResponseFilterset(FilterSet):
    class Meta:
        model = ReviewResponse
        fields = ("review",)

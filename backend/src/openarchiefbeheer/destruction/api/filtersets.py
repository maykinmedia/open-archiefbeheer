from django.db.models import Case, QuerySet, Value, When
from django.utils.translation import gettext_lazy as _

from django_filters import (
    BooleanFilter,
    FilterSet,
    NumberFilter,
    OrderingFilter,
    UUIDFilter,
)

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

    # FIXME: Due to the implementation of the dit page, the zake endpoint and the destruction list items endpoint
    # MUST return values in EXACTLY THE SAME order, untill we fix this properly, we use a special param
    # "item-order_match_zaken" to instruct the filter to order on the "zaak_pk" which is the (default) ordering of the
    # zaken endpoint.
    order_match_zaken = BooleanFilter(
        field_name="ordering",
        method="filter_order_match_zaken",
        help_text=_(
            "If edit mode is active, ordering should match ordering on the zaken endpoint, use the item-ordering param "
            "to define the exact same ordering as the zaak endpoint"
        ),
    )

    class Meta:
        model = DestructionListItem
        fields = (
            "destruction_list",
            "status",
            "processing_status",
            "order_match_zaken",
        )

    def filter_in_destruction_list(
        self, queryset: QuerySet[DestructionListItem], name: str, value: str
    ) -> QuerySet[DestructionListItem]:
        """
        Fixme: see filter field.
        """
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

    def filter_order_match_zaken(
        self, queryset: QuerySet[DestructionListItem], name: str, value: str
    ) -> QuerySet[DestructionListItem]:
        return queryset.order_by("zaak__pk")


class DestructionListFilterset(FilterSet):
    assignee = NumberFilter(
        field_name="assignee",
        help_text="The pk of the user currently assigned to the list.",
    )
    ordering = OrderingFilter(fields=("created", "created"))

    class Meta:
        model = DestructionList
        fields = ("assignee", "ordering")


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

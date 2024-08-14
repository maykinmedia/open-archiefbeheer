from django.db.models import Case, QuerySet, Subquery, Value, When
from django.utils.translation import gettext_lazy as _

from django_filters import FilterSet, NumberFilter, OrderingFilter, UUIDFilter

from openarchiefbeheer.zaken.api.filtersets import ZaakFilter
from openarchiefbeheer.zaken.models import Zaak

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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Add all the filters of the ZaakFilter filterset
        for name, filter_field in ZaakFilter().filters.items():
            self.filters["zaak__" + name] = filter_field

    def filter_queryset(self, queryset):
        zaak_filters = {}
        # Process the DestructionListItem filters. Extract all the zaak filters as these
        # will be handled by the ZaakFilter
        for name, value in self.form.cleaned_data.items():
            if name.startswith("zaak__"):
                zaak_filters[name.removeprefix("zaak__")] = value
                continue

            queryset = self.filters[name].filter(queryset, value)
            assert isinstance(
                queryset, QuerySet
            ), "Expected '%s.%s' to return a QuerySet, but got a %s instead." % (
                type(self).__name__,
                name,
                type(queryset).__name__,
            )

        zaak_qs = Zaak.objects.all()
        zaak_filter = ZaakFilter(data=self.data, queryset=zaak_qs)
        for name, value in zaak_filters.items():
            zaak_qs = zaak_filter.filters[name].filter(zaak_qs, value)
            assert isinstance(
                zaak_qs, QuerySet
            ), "Expected '%s.%s' to return a QuerySet, but got a %s instead." % (
                type(ZaakFilter).__name__,
                name,
                type(zaak_qs).__name__,
            )

        # Filter the destruction list item queryset to contain only
        # the items related to a zaak in the filtered zaken
        queryset = queryset.filter(zaak__url__in=Subquery(zaak_qs.values_list("url")))
        return queryset

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

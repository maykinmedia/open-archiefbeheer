from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from django_filters import BooleanFilter, CharFilter, FilterSet
from django_filters.rest_framework import DjangoFilterBackend

from ..models import SelectionItem


class SelectionItemFilterset(FilterSet):
    selected = BooleanFilter(
        field_name="selected",
        method="filter_selected",
        help_text=_("Filter on selected items."),
    )
    item = CharFilter(
        field_name="item",
        method="filter_item",
        help_text=_("Filter on the zaak url of an item"),
    )

    class Meta:
        model = SelectionItem
        fields = ("selected", "item")

    def filter_selected(
        self, queryset: QuerySet[SelectionItem], name: str, value: bool
    ) -> QuerySet[SelectionItem]:
        return queryset.filter(selection_data__selected=value)

    def filter_item(
        self, queryset: QuerySet[SelectionItem], name: str, value: str
    ) -> QuerySet[SelectionItem]:
        return queryset.filter(zaak_url=value)

    def make_dynamic_filters(self, request, queryset, view):
        for field_name in self.get_fields():
            request.query_params.pop(field_name, None)

        if not request.query_params:
            return

        formatted_filters = {}
        for key, value in request.query_params.items():
            if not isinstance(value, (int, float, str, bool)):
                continue

            filter_lhs = "selection_data__details__%(field_name)s" % {"field_name": key}
            filter_rhs = value
            formatted_filters[filter_lhs] = filter_rhs

        return formatted_filters


class SelectionItemBackend(DjangoFilterBackend):
    def filter_queryset(self, request, queryset, view):
        queryset = super().filter_queryset(request, queryset, view)

        filterset = self.get_filterset(request, queryset, view)
        dynamic_filters = filterset.make_dynamic_filters(request, queryset, view)
        if not dynamic_filters:
            return queryset

        return queryset.filter(**dynamic_filters)

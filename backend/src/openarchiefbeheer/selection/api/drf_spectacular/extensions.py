from drf_spectacular.contrib.django_filters import DjangoFilterExtension
from drf_spectacular.drainage import add_trace_message
from drf_spectacular.plumbing import build_basic_type, build_parameter_type
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes

from ...models import SelectionItem
from ..filtersets import SelectionItemFilterset


class SelectionItemFiltersExtension(DjangoFilterExtension):
    target_class = "openarchiefbeheer.selection.api.filtersets.SelectionItemBackend"
    priority = 1

    def get_schema_operation_parameters(self, auto_schema, *args, **kwargs):
        filterset_class = SelectionItemFilterset

        result = []
        with add_trace_message(filterset_class):
            for field_name, filter_field in filterset_class.base_filters.items():
                result += self.resolve_filter_field(
                    auto_schema,
                    SelectionItem,
                    filterset_class,
                    field_name,
                    filter_field,
                )

        result += [
            build_parameter_type(
                name="<parameter>",
                required=False,
                location=OpenApiParameter.QUERY,
                description=(
                    "Dynamic filter key for data inside the 'details' field. For example, "
                    'if the details field is ``{"test": "bla"}``, the filter would be ``?test=bla``.'
                ),
                schema=build_basic_type(OpenApiTypes.STR),
            )
        ]

        return result

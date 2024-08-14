from drf_spectacular.contrib.django_filters import DjangoFilterExtension
from drf_spectacular.drainage import add_trace_message

from openarchiefbeheer.zaken.api.filtersets import ZaakFilter
from openarchiefbeheer.zaken.models import Zaak


class DestructionListItemFilterExtension(DjangoFilterExtension):
    target_class = (
        "openarchiefbeheer.destruction.api.backends.DestructionListItemFilterBackend"
    )
    priority = 1

    def get_schema_operation_parameters(self, auto_schema, *args, **kwargs) -> list:
        destruction_list_items_filters = super().get_schema_operation_parameters(
            auto_schema, *args, **kwargs
        )

        # Add the filters from the Zaak filter
        filterset_class = ZaakFilter

        zaak_filters = []
        with add_trace_message(filterset_class):
            for field_name, filter_field in filterset_class.base_filters.items():
                zaak_filters += self.resolve_filter_field(
                    auto_schema,
                    Zaak,
                    filterset_class,
                    "zaak__" + field_name,
                    filter_field,
                )

        return destruction_list_items_filters + zaak_filters

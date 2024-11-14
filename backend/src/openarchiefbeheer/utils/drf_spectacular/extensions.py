from drf_spectacular.contrib.django_filters import DjangoFilterExtension
from drf_spectacular.drainage import add_trace_message


class NoModelFiltersExtension(DjangoFilterExtension):
    target_class = (
        "openarchiefbeheer.utils.django_filters.backends.NoModelFilterBackend"
    )
    priority = 2

    def get_schema_operation_parameters(self, auto_schema, *args, **kwargs):
        filterset_class = getattr(auto_schema.view, "filterset_class", None)
        if not filterset_class:
            return []

        result = []
        with add_trace_message(filterset_class):
            for field_name, filter_field in filterset_class.base_filters.items():
                result += self.resolve_filter_field(
                    auto_schema,
                    filterset_class._meta.model,
                    filterset_class,
                    field_name,
                    filter_field,
                )
        return result

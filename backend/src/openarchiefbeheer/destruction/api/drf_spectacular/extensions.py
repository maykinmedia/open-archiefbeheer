from drf_spectacular.contrib.django_filters import DjangoFilterExtension
from drf_spectacular.drainage import add_trace_message


class NestedFilterExtension(DjangoFilterExtension):
    target_class = "openarchiefbeheer.destruction.api.backends.NestedFilterBackend"
    priority = 1

    def _get_filters(self, auto_schema, filterset_class, prefix=""):
        model = filterset_class._meta.model

        result = []
        with add_trace_message(filterset_class):
            for field_name, filter_field in filterset_class.base_filters.items():
                result += self.resolve_filter_field(
                    auto_schema,
                    model,
                    filterset_class,
                    f"{prefix}-{field_name}" if prefix else field_name,
                    filter_field,
                )
        return result

    def get_nested_filters(self, auto_schema):
        nested_filterset_class = self.target.get_nested_filterset_class(
            auto_schema.view
        )
        return self._get_filters(auto_schema, nested_filterset_class)

    def get_main_filters(self, auto_schema):
        # We need to override the parent `get_schema_operation_parameters`
        # because it does not support using the prefix in the field name
        filterset_class = self.target.get_filterset_class(auto_schema.view)
        prefix = auto_schema.view.filterset_kwargs.get("prefix", "")

        return self._get_filters(auto_schema, filterset_class, prefix)

    def get_schema_operation_parameters(self, auto_schema, *args, **kwargs) -> list:
        main_filters = self.get_main_filters(auto_schema)
        nested_filters = self.get_nested_filters(auto_schema)
        return main_filters + nested_filters

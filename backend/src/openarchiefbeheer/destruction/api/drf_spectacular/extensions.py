from drf_spectacular.contrib.django_filters import DjangoFilterExtension
from drf_spectacular.drainage import add_trace_message


class NestedFilterExtension(DjangoFilterExtension):
    target_class = "openarchiefbeheer.destruction.api.backends.NestedFilterBackend"
    priority = 1

    def get_nested_filters(self, auto_schema):
        nested_filterset_class = self.target.get_nested_filterset_class(
            auto_schema.view
        )
        model = nested_filterset_class._meta.model

        result = []
        with add_trace_message(nested_filterset_class):
            for field_name, filter_field in nested_filterset_class.base_filters.items():
                result += self.resolve_filter_field(
                    auto_schema, model, nested_filterset_class, field_name, filter_field
                )
        return result

    def get_main_filters(self, auto_schema):
        # We need to override the parent `get_schema_operation_parameters`
        # because it does not support using the prefix in the field name
        filterset_class = self.target.get_filterset_class(auto_schema.view)
        model = filterset_class._meta.model
        prefix = auto_schema.view.filterset_kwargs.get("prefix", "")

        result = []
        with add_trace_message(filterset_class):
            for field_name, filter_field in filterset_class.base_filters.items():
                result += self.resolve_filter_field(
                    auto_schema,
                    model,
                    filterset_class,
                    f"{prefix}-{field_name}",
                    filter_field,
                )
        return result

    def get_schema_operation_parameters(self, auto_schema, *args, **kwargs) -> list:
        main_filters = self.get_main_filters(auto_schema)
        nested_filters = self.get_nested_filters(auto_schema)
        return main_filters + nested_filters

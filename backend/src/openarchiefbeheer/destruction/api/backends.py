from django_filters.rest_framework import DjangoFilterBackend
from django_filters.utils import translate_validation


class NestedFilterBackend(DjangoFilterBackend):
    def get_filterset_kwargs(self, request, queryset, view):
        return {
            "data": request.query_params,
            "queryset": queryset,
            "request": request,
            "prefix": view.filterset_kwargs.get("prefix", ""),
        }

    def filter_queryset(self, request, queryset, view):
        nested_filterset = self.get_nested_filterset(request, view)
        if not nested_filterset.is_valid() and self.raise_exception:
            raise translate_validation(nested_filterset.errors)

        if not len(nested_filterset.form.changed_data):
            # Case in which no query params for the nested filterset are present
            return super().filter_queryset(request, queryset, view)

        relation_field_filter = f"{view.nested_filterset_relation_field}__in"
        queryset = queryset.filter(**{relation_field_filter: nested_filterset.qs})
        return super().filter_queryset(request, queryset, view)

    def get_nested_filterset_class(self, view):
        return view.nested_filterset_class

    def get_nested_filterset(self, request, view):
        nested_filterset_class = self.get_nested_filterset_class(view)

        kwargs = {
            "data": request.query_params,
            "request": request,
        }
        return nested_filterset_class(**kwargs)

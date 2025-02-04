from django_filters.rest_framework import DjangoFilterBackend
from django_filters.utils import translate_validation
from rest_framework.filters import OrderingFilter


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


class NestedOrderingFilterBackend(OrderingFilter):
    def get_valid_fields(self, queryset, view, context={}) -> list[tuple[str, str]]:
        valid_fields = getattr(
            view, context.get("ordering_fields_view_attr", "ordering_fields"), []
        )

        if valid_fields is None:
            # Default to allowing filtering on serializer fields
            return self.get_default_valid_fields(queryset, view, {})

        elif valid_fields == "__all__":
            # View explicitly allows filtering on any model field
            valid_fields = [
                (field.name, field.verbose_name)
                for field in queryset.model._meta.fields
            ]
            valid_fields += [
                (key, key.title().split("__")) for key in queryset.query.annotations
            ]
        else:
            valid_fields = [
                (item, item) if isinstance(item, str) else item for item in valid_fields
            ]
        return valid_fields

    def get_valid_fields_keys(self, valid_fields) -> list[str]:
        return [item[0] for item in valid_fields]

    def is_term_valid(self, term, valid_fields) -> bool:
        if term.startswith("-"):
            term = term[1:]
        return term in valid_fields

    def get_ordering(self, request, queryset, view) -> list[str]:
        base_ordering_param = (
            f"{view.nested_ordering_prefix}-{self.ordering_param}"
            if view.nested_ordering_prefix
            else self.ordering_param
        )
        base_params = request.query_params.get(base_ordering_param)
        formatted_fields = []
        if base_params:
            fields = [param.strip() for param in base_params.split(",")]
            valid_fields = self.get_valid_fields_keys(
                self.get_valid_fields(queryset, view)
            )
            formatted_fields = [
                term for term in fields if self.is_term_valid(term, valid_fields)
            ]

        nested_params = request.query_params.get(self.ordering_param)
        if nested_params:
            fields = [param.strip() for param in nested_params.split(",")]
            nested_queryset = view.nested_ordering_model.objects.all()
            valid_fields = self.get_valid_fields_keys(
                self.get_valid_fields(
                    nested_queryset,
                    view,
                    context={"ordering_fields_view_attr": "nested_ordering_fields"},
                )
            )

            for term in fields:
                if not self.is_term_valid(term, valid_fields):
                    continue

                if is_reverse := term.startswith("-"):
                    term = term[1:]
                formatted_fields.append(
                    f"{"-" if is_reverse else ""}{view.nested_ordering_relation_field}__{term}"
                )
        return formatted_fields

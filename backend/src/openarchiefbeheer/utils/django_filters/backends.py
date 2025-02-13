from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter


class NoModelFilterBackend(DjangoFilterBackend):
    pass


class OrderingWithPostFilterBackend(OrderingFilter):
    """Support ordering params also in the request body."""

    def get_ordering_filters(self, request):
        return request.query_params or request.data

    def get_ordering(self, request, queryset, view):
        """
        Ordering is set by a comma delimited ?ordering=... query parameter.

        The `ordering` query parameter can be overridden by setting
        the `ordering_param` value on the OrderingFilter or by
        specifying an `ORDERING_PARAM` value in the API settings.
        """
        # Overriding where the filters are coming from (for us from the POST request body).
        # Normally they are query params.
        ordering_filters = self.get_ordering_filters(request)
        params = ordering_filters.get(self.ordering_param)
        if params:
            fields = [param.strip() for param in params.split(",")]
            ordering = self.remove_invalid_fields(queryset, fields, view, request)
            if ordering:
                return ordering

        # No ordering was included, or all the ordering fields were invalid
        return self.get_default_ordering(view)

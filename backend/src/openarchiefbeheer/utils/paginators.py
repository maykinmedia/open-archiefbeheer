from rest_framework.pagination import PageNumberPagination as _PageNumberPagination


class PageNumberPagination(_PageNumberPagination):
    page_size_query_param = "page_size"
    page_size = 100


class PageNumberPaginationWithPost(_PageNumberPagination):
    """Support pagination param also in request body"""

    page_size_query_param = "page_size"
    page_size = 100

    def get_page_number(self, request, paginator):
        params = request.query_params or request.data
        page_number = params.get(self.page_query_param) or 1
        if page_number in self.last_page_strings:
            page_number = paginator.num_pages
        return page_number

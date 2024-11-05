from rest_framework.routers import Route
from rest_framework_nested.routers import NestedSimpleRouter


class BulkNestedRouter(NestedSimpleRouter):
    """Nested router with bulk actions

    The post, patch and put actions act on a group of items related to the parent by FK.
    So we don't want them to be 'detail' endpoints.
    """

    routes = [
        Route(
            url=r"^{prefix}{trailing_slash}$",
            mapping={
                "get": "list",
                "post": "create",
                "put": "update",
                "patch": "partial_update",
            },
            name="{basename}-list",
            detail=False,
            initkwargs={"suffix": "List"},
        ),
    ]

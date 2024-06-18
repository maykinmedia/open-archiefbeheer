from django.utils.translation import gettext_lazy as _

from drf_spectacular.plumbing import build_array_type, build_basic_type
from drf_spectacular.utils import OpenApiExample, OpenApiTypes, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from ..constants import ListStatus


@extend_schema(
    summary=_("List destruction list statuses"),
    description=_("List the possible statuses that a destruction lists can have."),
    tags=["statuses"],
    responses={
        200: build_array_type(build_array_type(build_basic_type(OpenApiTypes.STR)))
    },
    examples=[
        OpenApiExample(
            name="Example response",
            response_only=True,
            value=[["key1", "label1"], ["key2", "label2"]],
        )
    ],
)
class ListStatusesListView(APIView):
    def get(self, request):
        return Response(ListStatus.choices)

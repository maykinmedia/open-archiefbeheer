from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from drf_spectacular.plumbing import build_array_type, build_basic_type
from drf_spectacular.utils import OpenApiExample, OpenApiTypes, extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.clients import zrc_client
from openarchiefbeheer.destruction.models import DestructionListItem

from ..constants import ListStatus


@extend_schema(
    tags=["Destruction list"],
    summary=_("List destruction list statuses"),
    description=_("List the possible statuses that a destruction lists can have."),
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


class RelatedObjectsView(APIView):
    def get(self, request: Request, pk: int) -> Response:
        destruction_list_item = get_object_or_404(DestructionListItem, pk=pk)

        with zrc_client() as client:
            response = client.get(
                "zaakobjecten", params={"zaak": destruction_list_item._zaak_url}
            )
            response.raise_for_status()

        return Response()

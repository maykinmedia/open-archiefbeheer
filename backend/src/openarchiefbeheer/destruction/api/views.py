from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from drf_spectacular.plumbing import build_array_type, build_basic_type
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.clients import zrc_client
from openarchiefbeheer.external_registers.utils import get_plugin_for_related_object
from openarchiefbeheer.zaken.utils import pagination_helper

from ..constants import ListStatus
from ..models import DestructionListItem
from .serializers import RelatedObjectSerializer


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
            data_iterator = pagination_helper(client, response.json())
            results = []
            for page in data_iterator:
                for zaakobject in page["results"]:
                    plugin = get_plugin_for_related_object(zaakobject["url"])
                    results.append(
                        {
                            "url": zaakobject["url"],
                            "selected": (
                                zaakobject["url"]
                                not in destruction_list_item.excluded_relations
                            ),
                            "supported": plugin is not None,
                            "result": zaakobject,
                        }
                    )

        serializer = RelatedObjectSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

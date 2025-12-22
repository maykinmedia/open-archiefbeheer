from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from drf_spectacular.plumbing import build_array_type, build_basic_type
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.external_registers.utils import get_plugin_for_related_object
from openarchiefbeheer.zaken.utils import (
    fetch_zaakobjects,
)

from ..constants import ListStatus
from ..models import DestructionListItem
from .serializers import RelatedObjectSerializer, SelectionRelatedObjectSerializer


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
    @extend_schema(
        tags=["Related Objects"],
        summary=_("List related objects selection"),
        description=_(
            "List which objects are related to a zaak, including information about "
            "whether their destruction in external registers is supported and whether they "
            "are excluded from destruction (selected: false)."
        ),
        responses={
            200: RelatedObjectSerializer(many=True),
        },
    )
    def get(self, request: Request, pk: int) -> Response:
        destruction_list_item = get_object_or_404(DestructionListItem, pk=pk)

        if not destruction_list_item.zaak or not (
            zaak_url := destruction_list_item.zaak.url
        ):
            return Response([])

        zaakobjects = fetch_zaakobjects(zaak_url)

        results = []
        for zaakobject in zaakobjects:
            plugin = get_plugin_for_related_object(zaakobject["object"])
            supported = plugin is not None

            results.append(
                {
                    "url": zaakobject["url"],
                    "selected": (
                        supported
                        and zaakobject["url"]
                        not in destruction_list_item.excluded_relations
                    ),
                    "supported": supported,
                    "result": zaakobject,
                }
            )

        serializer = RelatedObjectSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["Related Objects"],
        summary=_("Update related objects selection"),
        description=_(
            "Specify which supported related objects should be destroyed"
            " when the zaak is destroyed."
        ),
        request=SelectionRelatedObjectSerializer(many=True),
        responses={
            200: None,
        },
    )
    def patch(self, request: Request, pk: int) -> Response:
        destruction_list_item = get_object_or_404(DestructionListItem, pk=pk)

        # For performance purpose, we are not checking whether the URLs correspond to real ZaakObjects.
        # We are only saving the unselected objects URLs for checking during deletion if a related object
        # should not be deleted.
        serializer = SelectionRelatedObjectSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        assert isinstance(serializer.validated_data, list)
        excluded_urls = [
            item["url"] for item in serializer.validated_data if not item["selected"]
        ]

        destruction_list_item.excluded_relations = excluded_urls
        destruction_list_item.save()

        return Response()

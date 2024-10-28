from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiRequest,
    OpenApiResponse,
    extend_schema,
)
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import SelectionItem
from .serializers import SelectionReadSerializer, SelectionWriteSerializer


class SelectionView(APIView):
    def _get_selection_representation(self):
        read_serialiser = SelectionReadSerializer(data=self.kwargs)
        read_serialiser.is_valid(raise_exception=True)
        return read_serialiser.data

    @extend_schema(
        tags=["Selection"],
        summary=_("Get selection"),
        description=_(
            "Get the zaken in a selection and whether they are checked or not."
        ),
        responses={
            200: OpenApiResponse(
                response={
                    "type": "object",
                    "additionalProperties": {
                        "type": "object",
                        "description": "The zaak URL is used as key",
                        "properties": {
                            "selected": {"type": "boolean"},
                            "details": {"type": "object"},
                        },
                    },
                },
                examples=[
                    OpenApiExample(
                        "A selection",
                        value={
                            "http://zaken.nl/api/v1/zaken/111-111-111": {
                                "selected": True,
                                "details": {},
                            },
                            "http://zaken.nl/api/v1/zaken/222-222-222": {
                                "selected": False,
                                "details": {},
                            },
                        },
                    ),
                ],
            )
        },
    )
    def get(self, request, *args, **kwargs):
        return Response(self._get_selection_representation())

    @extend_schema(
        tags=["Selection"],
        summary=_("Add to selection"),
        description=_(
            "Get the zaken in a selection and whether they are checked or not."
        ),
        responses={201: None},
        request=OpenApiRequest(
            request={
                "type": "object",
                "additionalProperties": {
                    "type": "object",
                    "description": "The zaak URL is used as key",
                    "properties": {
                        "selected": {"type": "boolean"},
                        "details": {"type": "object"},
                    },
                },
            },
            examples=[
                OpenApiExample(
                    "Add to the selection",
                    value={
                        "http://zaken.nl/api/v1/zaken/111-111-111": {
                            "selected": True,
                            "details": {},
                        },
                        "http://zaken.nl/api/v1/zaken/222-222-222": {
                            "selected": False,
                            "details": {},
                        },
                    },
                ),
            ],
        ),
    )
    def post(self, request, *args, **kwargs):
        serializer = SelectionWriteSerializer(data=request.data, context=self.kwargs)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            data=self._get_selection_representation(), status=status.HTTP_201_CREATED
        )

    def put(self, request, *args, **kwargs):
        instances = SelectionItem.objects.filter(key=self.kwargs["key"])

        serializer = SelectionWriteSerializer(
            instance=instances, data=request.data, context=self.kwargs
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            data=self._get_selection_representation(), status=status.HTTP_200_OK
        )

    def patch(self, request, *args, **kwargs):
        instances = SelectionItem.objects.filter(key=self.kwargs["key"])

        serializer = SelectionWriteSerializer(
            instance=instances, data=request.data, context=self.kwargs, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            data=self._get_selection_representation(), status=status.HTTP_200_OK
        )

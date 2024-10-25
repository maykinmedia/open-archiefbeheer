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

from .serializers import SelectionReadSerializer, SelectionWriteSerializer


# TODO Update to use GenericAPIView?
class SelectionView(APIView):
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
        serialiser = SelectionReadSerializer(data=self.kwargs)
        serialiser.is_valid(raise_exception=True)

        return Response(serialiser.data)

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

        return Response(serializer.data, status=status.HTTP_201_CREATED)

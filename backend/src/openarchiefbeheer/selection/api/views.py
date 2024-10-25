from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SelectionSerializer


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
                        response_only=True,
                    ),
                ],
            )
        },
    )
    def get(self, request, *args, **kwargs):
        serialiser = SelectionSerializer(data=self.kwargs)
        serialiser.is_valid()

        return Response(serialiser.data)

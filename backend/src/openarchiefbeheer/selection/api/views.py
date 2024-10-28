from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import SelectionItem
from .schemas import SCHEMA_REQUEST, SCHEMA_RESPONSE
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
        responses={200: SCHEMA_RESPONSE},
    )
    def get(self, request, *args, **kwargs):
        return Response(self._get_selection_representation())

    @extend_schema(
        tags=["Selection"],
        summary=_("Add to selection"),
        description=_(
            "Get the zaken in a selection and whether they are checked or not."
        ),
        responses={201: SCHEMA_RESPONSE},
        request=SCHEMA_REQUEST,
    )
    def post(self, request, *args, **kwargs):
        serializer = SelectionWriteSerializer(data=request.data, context=self.kwargs)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            data=self._get_selection_representation(), status=status.HTTP_201_CREATED
        )

    @extend_schema(
        tags=["Selection"],
        summary=_("Update to selection"),
        description=_("Fully update a selection."),
        responses={200: SCHEMA_RESPONSE},
        request=SCHEMA_REQUEST,
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

    @extend_schema(
        tags=["Selection"],
        summary=_("Partial update to selection"),
        description=_("Partially update a selection."),
        responses={200: SCHEMA_RESPONSE},
        request=SCHEMA_REQUEST,
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

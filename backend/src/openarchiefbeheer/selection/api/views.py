from django.utils.translation import gettext_lazy as _

from drf_spectacular.plumbing import build_basic_type, build_object_type
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import AllSelectedToggle, SelectionItem
from .filtersets import SelectionItemBackend, SelectionItemFilterset
from .schemas import SCHEMA_REQUEST, SCHEMA_RESPONSE
from .serializers import (
    SelectAllToggleSerializer,
    SelectionReadSerializer,
    SelectionWriteSerializer,
)


class SelectionView(GenericAPIView):
    filter_backends = (SelectionItemBackend,)
    filterset_class = SelectionItemFilterset
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def get_queryset(self):
        return SelectionItem.objects.filter(key=self.kwargs["key"])

    def _get_selection_representation(self, queryset=None):
        qs = queryset
        if qs is None:
            qs = self.get_queryset()

        read_serialiser = SelectionReadSerializer(instance=qs)
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
        queryset = self.filter_queryset(self.get_queryset())

        return Response(self._get_selection_representation(queryset))

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

    @extend_schema(
        tags=["Selection"],
        summary=_("Clear selection"),
        description=_("Clear a selection."),
        responses={204: None},
        request=None,
    )
    def delete(self, request, *args, **kwargs):
        instances = SelectionItem.objects.filter(key=self.kwargs["key"])
        instances.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class SelectionCountView(APIView):
    @extend_schema(
        tags=["Selection"],
        summary=_("Count selected items"),
        description=_(
            "Retrieve how many items are selected. "
            "It does not take into account the 'selected all' toggle."
        ),
        responses={
            200: build_object_type({"count": build_basic_type(OpenApiTypes.INT)})
        },
        request=None,
    )
    def get(self, request, *args, **kwargs):
        key = self.kwargs["key"]

        # The count operation does not take into consideration the select all toggle.
        qs = SelectionItem.objects.filter(key=key, selection_data__selected=True)

        return Response(data={"count": qs.count()}, status=status.HTTP_200_OK)


class SelectionSelectAllView(APIView):
    @extend_schema(
        tags=["Selection"],
        summary=_("Select all (on)"),
        description=_("Toggle the selected_all property to true."),
        responses={200: None},
        request=None,
    )
    def post(self, request, *args, **kwargs):
        key = self.kwargs["key"]

        toggle, created = AllSelectedToggle.objects.get_or_create(key=key)
        if toggle.all_selected:
            return Response(status=status.HTTP_200_OK)

        toggle.all_selected = True
        toggle.save()

        return Response(status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Selection"],
        summary=_("Select all (off)"),
        description=_("Toggle the selected_all property to false."),
        responses={204: None},
        request=None,
    )
    def delete(self, request, *args, **kwargs):
        key = self.kwargs["key"]

        toggle, created = AllSelectedToggle.objects.get_or_create(key=key)
        if not toggle.all_selected:
            return Response(status=status.HTTP_204_NO_CONTENT)

        toggle.all_selected = False
        toggle.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        tags=["Selection"],
        summary=_("Get select all value"),
        description=_(
            "Check if all the items in a selection are selected with the 'select all' toggle."
        ),
        responses={200: AllSelectedToggle},
        request=None,
    )
    def get(self, request, *args, **kwargs):
        key = self.kwargs["key"]

        toggle, created = AllSelectedToggle.objects.get_or_create(key=key)

        serializer = SelectAllToggleSerializer(instance=toggle)
        return Response(data=serializer.data)

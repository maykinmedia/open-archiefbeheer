from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import AllSelectedToggle, SelectionItem
from .filtersets import SelectionItemBackend, SelectionItemFilterset
from .schemas import SCHEMA_REQUEST, SCHEMA_RESPONSE
from .serializers import SelectionReadSerializer, SelectionWriteSerializer


class SelectionView(GenericAPIView):
    filter_backends = (SelectionItemBackend,)
    filterset_class = SelectionItemFilterset

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
    def get(self, request, *args, **kwargs):
        key = self.kwargs["key"]

        toggle, created = AllSelectedToggle.objects.get_or_create(key=key)
        qs = SelectionItem.objects.filter(key=key)
        if not toggle.all_selected:
            qs = qs.filter(selection_data__selected=True)

        return Response(data={"count": qs.count()}, status=status.HTTP_200_OK)


class SelectionSelectAllView(APIView):
    def post(self, request, *args, **kwargs):
        key = self.kwargs["key"]

        toggle, created = AllSelectedToggle.objects.get_or_create(key=key)
        if toggle.all_selected:
            return Response(status=status.HTTP_200_OK)

        toggle.all_selected = True
        toggle.save()

        return Response(status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        key = self.kwargs["key"]

        toggle, created = AllSelectedToggle.objects.get_or_create(key=key)
        if not toggle.all_selected:
            return Response(status=status.HTTP_204_NO_CONTENT)

        toggle.all_selected = False
        toggle.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import cache_page

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.utils.datastructure import HashableDict

from ..models import Zaak
from ..tasks import retrieve_and_cache_zaken_from_openzaak
from ..utils import (
    format_zaaktype_choices,
    retrieve_paginated_type,
    retrieve_selectielijstklasse_choices,
)
from .filtersets import ZaakFilter
from .serializers import (
    ChoiceSerializer,
    SelectielijstklasseChoicesQueryParamSerializer,
    SelectielijstklasseChoicesSerializer,
    ZaaktypeChoiceSerializer,
    ZaakTypeChoicesQueryParamSerializer,
)


class CacheZakenView(APIView):
    permission_classes = (IsAdminUser,)

    @extend_schema(
        summary=_("Retrieve and cache zaken"),
        description=_("Retrieve and cache zaken from OpenZaak in the background."),
        tags=["private"],
    )
    def post(self, request, *args, **kwargs):
        retrieve_and_cache_zaken_from_openzaak.delay()
        return Response(status=status.HTTP_200_OK)


class ZaaktypenChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve zaaktypen choices"),
        description=_(
            "Retrieve zaaktypen from Open Zaak and return a value and a label per zaaktype. "
            "The label is the 'identificatie' field an the value is a string of comma separated URLs. "
            "There are multiple URLs per identificatie if there are multiple versions of a zaaktype. "
            "If there are no zaken of a particular zaaktype in the database, then that zaaktype is not returned. "
            "The response is cached for 15 minutes."
        ),
        tags=["private"],
        parameters=[ZaakTypeChoicesQueryParamSerializer],
        responses={
            200: ZaaktypeChoiceSerializer,
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        param_serializer = ZaakTypeChoicesQueryParamSerializer(
            data=request.query_params
        )
        param_serializer.is_valid(raise_exception=True)

        filters = (
            {"not_in_destruction_list": True}
            if not len(param_serializer.data.keys())
            else param_serializer.data
        )

        filterset = ZaakFilter(data=filters)
        filterset.is_valid()

        zaaktypen = filterset.qs.distinct("_expand__zaaktype__url").values_list(
            "_expand__zaaktype", flat=True
        )
        zaaktypen_choices = format_zaaktype_choices(zaaktypen)

        serializer = ZaaktypeChoiceSerializer(data=zaaktypen_choices, many=True)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SelectielijstklasseChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve selectielijstklasse choices"),
        description=_(
            "Returns all the resultaten from the configured selectielijst API with a formatted label. If the parameter 'zaak' is provided, then it returns all the 'resultaten' possible for the given 'selectielijstprocestype' from the 'zaaktype' of the zaak."
        ),
        tags=["private"],
        responses={
            200: SelectielijstklasseChoicesSerializer,
        },
        parameters=[SelectielijstklasseChoicesQueryParamSerializer],
    )
    def get(self, request, *args, **kwargs):
        serializer = SelectielijstklasseChoicesQueryParamSerializer(
            data=request.query_params
        )
        serializer.is_valid(raise_exception=True)

        query_params = HashableDict()
        if zaak_url := serializer.validated_data.get("zaak"):
            zaak = get_object_or_404(Zaak, url=zaak_url)
            processtype = zaak._expand["zaaktype"].get("selectielijst_procestype")
            query_params.update({"procesType": processtype["url"]})

        choices = retrieve_selectielijstklasse_choices(query_params)
        return Response(data=choices)


class StatustypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve statustypen choices"),
        description=_(
            "Retrieve statustypen from Open Zaak and return a "
            "value and a label per statustype. The label is the field 'omschrijving'."
        ),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        results = retrieve_paginated_type("statustypen")

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class InformatieobjecttypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve informatieobjecttypen choices"),
        description=_(
            "Retrieve informatieobjecttypen from Open Zaak and return a "
            "value and a label per informatieobjecttype. The label is the field 'omschrijving'."
        ),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        results = retrieve_paginated_type("informatieobjecttypen")

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class ResultaattypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve resultaattypen choices"),
        description=_(
            "Retrieve resultaattypen from Open Zaak and return a "
            "value and a label per resultaattype. The label is the field 'omschrijving'."
        ),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        results = retrieve_paginated_type("resultaattypen")

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

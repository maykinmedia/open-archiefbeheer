from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import cache_page

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.utils.datastructure import HashableDict
from openarchiefbeheer.utils.django_filters.backends import NoModelFilterBackend

from ..models import Zaak
from ..tasks import retrieve_and_cache_zaken_from_openzaak
from ..utils import (
    format_zaaktype_choices,
    retrieve_paginated_type,
    retrieve_selectielijstklasse_choices,
    retrieve_zaaktypen,
)
from .filtersets import ZaakFilterSet
from .mixins import FilterOnZaaktypeMixin
from .serializers import (
    ChoiceSerializer,
    SelectielijstklasseChoicesQueryParamSerializer,
    ZaaktypeFilterSerializer,
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


class InternalZaaktypenChoicesView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = (NoModelFilterBackend,)
    filterset_class = ZaakFilterSet

    def get_queryset(self):
        return Zaak.objects.all()

    def _retrieve_zaaktypen(self, request):
        filterset = ZaakFilterSet(data=request.query_params or request.data)
        is_valid = filterset.is_valid()
        if not is_valid:
            raise ValidationError(filterset.errors)

        # FIXME issue #712
        # The filter not_in_destruction_list_except does an order_by on "in_exception_list" and "pk"
        # However, we cannot combine a distinct and an order_by on different fields.
        # So we add an order by on "_expand__zaaktype__url" as a bandaid fix until we fix the ordering in the filter
        qs = filterset.qs
        if filterset.data.get("not_in_destruction_list_except"):
            qs = qs.order_by("_expand__zaaktype__url")

        zaaktypen = qs.distinct("_expand__zaaktype__url").values_list(
            "_expand__zaaktype", flat=True
        )
        zaaktypen_choices = format_zaaktype_choices(zaaktypen)

        serializer = ChoiceSerializer(data=zaaktypen_choices, many=True)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary=_("Retrieve local zaaktypen choices"),
        description=_(
            "Retrieve zaaktypen of the zaken stored in the OAB database and return a value and a label per zaaktype. "
            "The label is the 'identificatie' field an the value is a string of comma separated URLs. "
            "There are multiple URLs per identificatie if there are multiple versions of a zaaktype. "
            "If there are no zaken of a particular zaaktype in the database, then that zaaktype is not returned. "
            "The response is cached for 15 minutes.\n"
            "All the filters for the zaken are available to limit which zaaktypen should be returned."
        ),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        return self._retrieve_zaaktypen(request)

    @extend_schema(
        summary=_("Search local zaaktypen choices"),
        description=_(
            "Retrieve zaaktypen of the zaken stored in the OAB database and return a value and a label per zaaktype. "
            "The label is the 'identificatie' field an the value is a string of comma separated URLs. "
            "There are multiple URLs per identificatie if there are multiple versions of a zaaktype. "
            "If there are no zaken of a particular zaaktype in the database, then that zaaktype is not returned. "
            "The response is cached for 15 minutes.\n"
            "All the filters for the zaken are available to limit which zaaktypen should be returned."
        ),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def post(self, request, *args, **kwargs):
        return self._retrieve_zaaktypen(request)


class ExternalZaaktypenChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve external zaaktypen choices"),
        description=_(
            "Retrieve zaaktypen from Open Zaak and return a value and a label per zaaktype. "
            "The label is the 'identificatie' field an the value is a string of comma separated URLs. "
            "There are multiple URLs per identificatie if there are multiple versions of a zaaktype. "
            "If there are no zaken of a particular zaaktype in the database, then that zaaktype is not returned. "
            "The response is cached for 15 minutes.\n"
            "All the filters for the zaken are available to limit which zaaktypen should be returned."
        ),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        results = retrieve_zaaktypen()
        zaaktypen_choices = format_zaaktype_choices(results)
        return Response(zaaktypen_choices, status=status.HTTP_200_OK)


class SelectielijstklasseChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve selectielijstklasse choices"),
        description=_(
            "Returns all the resultaten from the configured selectielijst API with a formatted label. If the parameter 'zaak' is provided, then it returns all the 'resultaten' possible for the given 'selectielijstprocestype' from the 'zaaktype' of the zaak."
        ),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
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


class StatustypeChoicesView(FilterOnZaaktypeMixin, APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve statustypen choices"),
        description=_(
            "Retrieve statustypen from Open Zaak and return a "
            "value and a label per statustype. The label is the field 'omschrijving'."
        ),
        parameters=[ZaaktypeFilterSerializer],
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        query_params = self.get_query_params(request)
        results = retrieve_paginated_type("statustypen", query_params)

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class InformatieobjecttypeChoicesView(FilterOnZaaktypeMixin, APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve informatieobjecttypen choices"),
        description=_(
            "Retrieve informatieobjecttypen from Open Zaak and return a "
            "value and a label per informatieobjecttype. The label is the field 'omschrijving'."
        ),
        parameters=[ZaaktypeFilterSerializer],
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        query_params = self.get_query_params(request)
        results = retrieve_paginated_type("informatieobjecttypen", query_params)

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class ExternalResultaattypeChoicesView(FilterOnZaaktypeMixin, APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve resultaattypen choices"),
        description=_(
            "Retrieve resultaattypen from Open Zaak and return a "
            "value and a label per resultaattype. The label is the field 'omschrijving'."
        ),
        parameters=[ZaaktypeFilterSerializer],
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        query_params = self.get_query_params(request)
        results = retrieve_paginated_type("resultaattypen", query_params)

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class InternalResultaattypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]
    filter_backends = (NoModelFilterBackend,)
    filterset_class = ZaakFilterSet

    @extend_schema(
        summary=_("Retrieve internal resultaattype choices"),
        description=_("Retrieve the resultaattypen of the zaken in the database. "),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        filterset = ZaakFilterSet(data=request.query_params or request.data)
        is_valid = filterset.is_valid()
        if not is_valid:
            raise ValidationError(filterset.errors)

        zaken_resultaattypen = filterset.qs.filter(
            _expand__resultaat___expand__resultaattype__isnull=False
        ).values_list("_expand__resultaat___expand__resultaattype", flat=True)

        existing_resultaattypen = []
        formatted_choices = []
        for resultaattype in zaken_resultaattypen:
            if resultaattype["url"] in existing_resultaattypen:
                continue

            existing_resultaattypen.append(resultaattype["url"])
            formatted_choices.append(
                {
                    "label": resultaattype["omschrijving"],
                    "value": resultaattype["url"],
                }
            )
        return Response(formatted_choices, status=status.HTTP_200_OK)


class BehandelendAfdelingInternalChoicesView(APIView):
    permission_classes = [IsAuthenticated]
    filter_backends = (NoModelFilterBackend,)
    filterset_class = ZaakFilterSet

    @extend_schema(
        summary=_("Retrieve behandelend afdeling choices"),
        description=_(
            "Retrieve the behandelend afdelingen the zaken in the database. "
            'These have rollen with betrokkeneType equal to "organisatorische_eenheid".'
        ),
        tags=["private"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        filterset = ZaakFilterSet(data=request.query_params or request.data)
        is_valid = filterset.is_valid()
        if not is_valid:
            raise ValidationError(filterset.errors)

        zaken_rollen = filterset.qs.filter(
            _expand__rollen__contains=[{"betrokkene_type": "organisatorische_eenheid"}]
        ).values_list("_expand__rollen", flat=True)

        existing_rollen = []
        formatted_choices = []
        for zaak_rollen in zaken_rollen:
            for rol in zaak_rollen:
                if (
                    rol["url"] in existing_rollen
                    or rol["betrokkene_type"] != "organisatorische_eenheid"
                ):
                    continue

                existing_rollen.append(rol["url"])
                formatted_choices.append(
                    {"label": rol.get("omschrijving", rol["url"]), "value": rol["url"]}
                )

        return Response(formatted_choices, status=status.HTTP_200_OK)

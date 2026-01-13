from collections import defaultdict
from itertools import chain

from django.utils.decorators import method_decorator
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import cache_page

from drf_spectacular.utils import extend_schema
from maykin_config_checks import JSONValue
from mozilla_django_oidc_db.constants import OIDC_ADMIN_CONFIG_IDENTIFIER
from mozilla_django_oidc_db.models import OIDCClient
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.destruction.api.permissions import CanConfigureApplication
from openarchiefbeheer.zaken.api.serializers import ChoiceSerializer
from openarchiefbeheer.zaken.utils import retrieve_paginated_type, retrieve_zaaktypen

from ..models import ArchiveConfig
from .serializers import (
    ApplicationInfoSerializer,
    ArchiveConfigSerializer,
    OIDCInfoSerializer,
)


class ShortProcessZaaktypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_(
            "Retrieve zaaktypen choices for configuring the short archiving process."
        ),
        description=_(
            "Retrieve zaaktypen from Open Zaak needed to configure the short archiving process. "
            "Since these must include all version of a zaaktype, they are based on the field 'identificatie' "
            "which remains the same across versions."
            "The label is the 'omschrijving' fiel and the value is the 'identificatie' field. "
            "The response is cached for 15 minutes.\n"
        ),
        tags=["Configuration"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        zaaktypen = retrieve_zaaktypen()
        zaaktypen_choices = {}

        def _sort_key(item: dict[str, JSONValue]) -> str:
            assert isinstance(item["begin_geldigheid"], str)
            return item["begin_geldigheid"]

        for zaaktype in sorted(zaaktypen, key=_sort_key, reverse=True):
            if (
                identificatie := zaaktype.get("identificatie", "")
            ) in zaaktypen_choices:
                continue

            zaaktypen_choices[identificatie] = {
                "label": (
                    f"{zaaktype['omschrijving']} ({identificatie or _('no identificatie')})"
                ),
                "value": identificatie,
            }

        zaaktypen_choices = sorted(zaaktypen_choices.values(), key=lambda x: x["label"])
        return Response(zaaktypen_choices, status=status.HTTP_200_OK)


class DestructionReportZaaktypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve zaaktypen choices for configuring the destruction report."),
        description=_(
            "Retrieve zaaktypen from Open Zaak for configuring the destruction report. "
            "This returns all versions of each zaaktype. The label is a combination of the 'omschrijving', "
            "'identificatie' and the 'begin geldigheid'. "
            "The response is cached for 15 minutes.\n"
        ),
        tags=["Configuration"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        zaaktypen = retrieve_zaaktypen()

        def _sort_key(item: dict[str, JSONValue]) -> str:
            assert isinstance(item["begin_geldigheid"], str)
            return item["begin_geldigheid"]

        formatted_choices = defaultdict(list)
        for zaaktype in sorted(zaaktypen, key=_sort_key, reverse=True):
            identificatie = zaaktype.get("identificatie", "")
            omschrijving = zaaktype["omschrijving"]
            label = f"{zaaktype['begin_geldigheid']} - {omschrijving}"
            formatted_choices[identificatie].append(
                {"label": label, "value": zaaktype["url"]}
            )

        return Response(
            list(chain.from_iterable(formatted_choices.values())),
            status=status.HTTP_200_OK,
        )


class DestructionReportInformatieobjecttypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve informatieobjecttypen choices"),
        description=_(
            "Retrieve informatieobjecttypen from Open Zaak and return a "
            "value and a label per informatieobjecttype. The label is the field 'omschrijving'. "
            "It takes as parameter the same parameters of the Open Zaak endpoint."
        ),
        tags=["Configuration"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        results = retrieve_paginated_type("informatieobjecttypen", request.query_params)

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class DestructionReportResultaattypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve resultaattypen choices"),
        description=_(
            "Retrieve resultaattypen from Open Zaak and return a "
            "value and a label per resultaattype. The label is the field 'omschrijving'. "
            "It takes as parameter the same parameters of the Open Zaak endpoint."
        ),
        tags=["Configuration"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        results = retrieve_paginated_type("resultaattypen", request.query_params)

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class DestructionReportStatustypeChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary=_("Retrieve statustypen choices"),
        description=_(
            "Retrieve statustypen from Open Zaak and return a "
            "value and a label per statustype. The label is the field 'omschrijving'. "
            "It takes as parameter the same parameters of the Open Zaak endpoint."
        ),
        tags=["Configuration"],
        responses={
            200: ChoiceSerializer(many=True),
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        results = retrieve_paginated_type("statustypen", request.query_params)

        serializer = ChoiceSerializer(data=results, many=True)
        serializer.is_valid(raise_exception=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class ArchiveConfigView(APIView):
    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        if self.request.method in ["PATCH", "PUT"]:
            permissions.append(CanConfigureApplication())

        return permissions

    @extend_schema(
        tags=["Configuration"],
        summary=_("Retrieve archive configuration"),
        description=_("Retrieve archive configuration."),
        responses={200: ArchiveConfigSerializer},
    )
    def get(self, request, *args, **kwargs) -> Response:
        config = ArchiveConfig.get_solo()

        serializer = ArchiveConfigSerializer(instance=config)
        return Response(data=serializer.data)

    def update(self, *, partial: bool = False) -> Response:
        config = ArchiveConfig.get_solo()

        serializer = ArchiveConfigSerializer(
            instance=config, data=self.request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(data=serializer.data)

    @extend_schema(
        tags=["Configuration"],
        summary=_("Update archive configuration"),
        description=_("Update archive configuration."),
        request=ArchiveConfigSerializer,
        responses={200: ArchiveConfigSerializer},
    )
    def put(self, request, *args, **kwargs) -> Response:
        return self.update()

    @extend_schema(
        tags=["Configuration"],
        summary=_("Update archive configuration"),
        description=_("Partially update archive configuration."),
        request=ArchiveConfigSerializer,
        responses={200: ArchiveConfigSerializer},
    )
    def patch(self, request, *args, **kwargs) -> Response:
        return self.update(partial=True)


class OIDCInfoView(APIView):
    authentication_classes = ()
    permission_classes = ()

    @extend_schema(
        summary=_("Retrieve OIDC info"),
        description=_("Returns info about OIDC that is needed by the frontend. "),
        tags=["Configuration"],
        responses={
            200: OIDCInfoSerializer,
        },
    )
    def get(self, request: Request, *args, **kwargs):
        config = OIDCClient.objects.get(identifier=OIDC_ADMIN_CONFIG_IDENTIFIER)
        serializer = OIDCInfoSerializer(instance=config, context={"request": request})
        return Response(serializer.data)


@extend_schema(
    tags=["Configuration"],
    summary=_("App info"),
    description=_("Returns information about the application."),
    responses={
        200: ApplicationInfoSerializer(),
    },
)
class ApplicationInfoView(APIView):
    def get(self, request: Request, *args, **kwargs):
        serializer = ApplicationInfoSerializer(data={})
        serializer.is_valid()

        return Response(serializer.data)

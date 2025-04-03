from functools import lru_cache

from django.utils.translation import gettext_lazy as _

from djangorestframework_camel_case.util import camelize
from drf_spectacular.utils import extend_schema_field
from furl import furl
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField
from zgw_consumers.models import Service

from ..models import Zaak
from ..utils import (
    get_selectielijstklasse_choices_dict,
    get_selectielijstprocestypen_dict,
    get_selectielijstresultaten_dict,
)


class ZaakListSerializer(serializers.ListSerializer):
    def create(self, validated_data):
        zaken_to_create = [Zaak(**item) for item in validated_data]
        return Zaak.objects.bulk_create(zaken_to_create)


class ZaakSerializer(serializers.ModelSerializer):
    zaakgeometrie = GeometryField(required=False, allow_null=True)

    class Meta:
        model = Zaak
        list_serializer_class = ZaakListSerializer
        fields = (
            "uuid",
            "url",
            "rollen",
            "status",
            "zaaktype",
            "deelzaken",
            "einddatum",
            "hoofdzaak",
            "kenmerken",
            "resultaat",
            "startdatum",
            "verlenging",
            "opschorting",
            "toelichting",
            "omschrijving",
            "zaakobjecten",
            "archiefstatus",
            "eigenschappen",
            "identificatie",
            "processobject",
            "zaakgeometrie",
            "bronorganisatie",
            "publicatiedatum",
            "archiefnominatie",
            "einddatum_gepland",
            "registratiedatum",
            "archiefactiedatum",
            "processobjectaard",
            "betalingsindicatie",
            "communicatiekanaal",
            "laatste_betaaldatum",
            "producten_of_diensten",
            "selectielijstklasse",
            "relevante_andere_zaken",
            "zaakinformatieobjecten",
            "startdatum_bewaartermijn",
            "betalingsindicatie_weergave",
            "opdrachtgevende_organisatie",
            "vertrouwelijkheidaanduiding",
            "uiterlijke_einddatum_afdoening",
            "verantwoordelijke_organisatie",
            "_expand",
        )


class ChoiceSerializer(serializers.Serializer):
    label = serializers.CharField(help_text=_("The description field of the choice."))
    value = serializers.CharField(
        help_text=_("The URL of the choice."), allow_blank=True
    )
    extra_data = serializers.JSONField(
        help_text=_("Any extra information about this choice."),
        required=False,
    )


class SelectielijstklasseChoicesQueryParamSerializer(serializers.Serializer):
    zaak = serializers.URLField(
        required=False,
        help_text=_(
            "The URL of the zaak for which the selectielijstklasse choices are needed."
        ),
    )


class ZaaktypeFilterSerializer(serializers.Serializer):
    zaaktype = serializers.URLField(
        required=False,
        help_text=_("The URL of the zaaktype on which to filter."),
    )
    zaaktype_identificatie = serializers.CharField(
        required=False,
        help_text=_("The identificatie of the zaaktype on which to filter."),
    )

    def to_representation(self, instance):
        return camelize(instance)


@lru_cache
def get_service(url: str) -> Service | None:
    return Service.get_service(url)


# The structure of ZaakMetadataSerializer needs to remain in sync with ZAAK_METADATA_FIELDS_MAPPINGS
# TODO: Make more robust so that we don't have to worry about keeping in sync
class ZaakMetadataSerializer(serializers.ModelSerializer):
    zaaktype = serializers.SerializerMethodField()
    resultaat = serializers.SerializerMethodField()
    bronapplicatie = serializers.SerializerMethodField()
    selectielijstklasse = serializers.SerializerMethodField()
    selectielijstklasse_versie = serializers.SerializerMethodField()

    class Meta:
        model = Zaak
        fields = (
            "url",
            "einddatum",
            "resultaat",
            "startdatum",
            "omschrijving",
            "identificatie",
            "zaaktype",
            "bronapplicatie",
            "selectielijstklasse",
            "selectielijstklasse_versie",
        )

    @extend_schema_field(serializers.JSONField)
    def get_zaaktype(self, zaak: Zaak) -> dict | None:
        zaaktype = zaak._expand["zaaktype"]
        return {
            "uuid": furl(zaaktype["url"]).path.segments[-1],
            "url": zaaktype["url"],
            "omschrijving": zaaktype["omschrijving"],
            "identificatie": zaaktype.get("identificatie", ""),
            "selectielijst_procestype": zaaktype["selectielijst_procestype"],
        }

    @extend_schema_field(serializers.JSONField)
    def get_resultaat(self, zaak: Zaak) -> dict | None:
        if not zaak.resultaat:
            return None

        resultaattype = zaak._expand["resultaat"]["_expand"]["resultaattype"]
        return {
            "url": zaak._expand["resultaat"]["url"],
            "resultaattype": {
                "omschrijving": resultaattype["omschrijving"],
            },
        }

    @extend_schema_field(serializers.CharField)
    def get_bronapplicatie(self, zaak: Zaak) -> str:
        # Remove the UUID from the url. In this way we query the database to
        # get the service only once (since the base URL for the zaken endpoint doesn't change)
        zaak_url = furl(zaak.url)
        zaak_url.path.segments = zaak_url.path.segments[:-1]

        service = get_service(zaak_url.url)
        return service.label

    @extend_schema_field(serializers.CharField)
    def get_selectielijstklasse(self, zaak: Zaak) -> str:
        selectielijstklasse_choices_dict = get_selectielijstklasse_choices_dict()
        selectielijstklasse = (
            zaak.selectielijstklasse
            or zaak._expand["resultaat"]["_expand"]["resultaattype"][
                "selectielijstklasse"
            ]
        )

        return selectielijstklasse_choices_dict.get(selectielijstklasse, {}).get(
            "label", ""
        )

    @extend_schema_field(serializers.CharField)
    def get_selectielijstklasse_versie(self, zaak: Zaak) -> str:
        procestypen_dict = get_selectielijstprocestypen_dict()
        resultaten_dict = get_selectielijstresultaten_dict()
        selectielijstklasse = (
            zaak.selectielijstklasse
            or zaak._expand["resultaat"]["_expand"]["resultaattype"][
                "selectielijstklasse"
            ]
        )
        resultaat = resultaten_dict.get(selectielijstklasse)
        if not resultaat:
            return ""
        return str(procestypen_dict[resultaat["proces_type"]]["jaar"])

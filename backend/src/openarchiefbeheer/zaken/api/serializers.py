from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from ..models import Zaak


class ZaakSerializer(serializers.ModelSerializer):
    zaakgeometrie = GeometryField(required=False, allow_null=True)

    class Meta:
        model = Zaak
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
    value = serializers.CharField(help_text=_("The URL of the choice."))
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


# The structure of ZaakMetadataSerializer needs to remain in sync with ZAAK_METADATA_FIELDS_MAPPINGS
# TODO: Make more robust so that we don't have to worry about keeping in sync
class ZaakMetadataSerializer(serializers.ModelSerializer):
    zaaktype = serializers.SerializerMethodField()
    resultaat = serializers.SerializerMethodField()

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
        )

    @extend_schema_field(serializers.JSONField)
    def get_zaaktype(self, zaak: Zaak) -> dict | None:
        zaaktype = zaak._expand["zaaktype"]
        return {
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

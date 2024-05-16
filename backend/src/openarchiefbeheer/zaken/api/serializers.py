from django.utils.translation import gettext_lazy as _

from rest_framework import serializers

from openarchiefbeheer.zaken.models import Zaak


class ZaakSerializer(serializers.ModelSerializer):
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


class ZaaktypeChoiceSerializer(serializers.Serializer):
    label = serializers.CharField(help_text=_("The description field of the zaaktype."))
    value = serializers.CharField(help_text=_("The URL field of the zaaktype."))
    extra = serializers.CharField(
        help_text=_(
            "A combination of the identification and the date on which "
            "the zaaktype will no longer be valid (if present)."
        )
    )

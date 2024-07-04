from django.conf import settings
from django.contrib.gis.db.models import GeometryField
from django.contrib.postgres.fields import ArrayField
from django.db import models

from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service


class Zaak(models.Model):
    uuid = models.UUIDField("UUID", unique=True)
    url = models.URLField("URL", max_length=1000)
    rollen = ArrayField(
        models.URLField("rollen", max_length=1000, blank=True), null=True, blank=True
    )
    status = models.URLField("status", max_length=1000, blank=True, null=True)
    zaaktype = models.URLField("zaaktype", blank=True, null=True)
    deelzaken = ArrayField(
        models.URLField("deelzaken", max_length=1000, blank=True),
        null=True,
        blank=True,
    )
    einddatum = models.DateField("einddatum", blank=True, null=True)
    hoofdzaak = models.URLField("hoofdzaak", max_length=1000, blank=True, null=True)
    kenmerken = models.JSONField("kenmerken", blank=True, null=True)
    resultaat = models.URLField("resultaat", blank=True, null=True)
    startdatum = models.DateField("startdatum")
    verlenging = models.JSONField("verlenging", blank=True, null=True)
    opschorting = models.JSONField("opschorting", blank=True, null=True)
    toelichting = models.CharField("toelichting", max_length=1000, blank=True)
    omschrijving = models.CharField("omschrijving", max_length=80, blank=True)
    zaakobjecten = ArrayField(
        models.URLField("zaakobjecten", max_length=1000, blank=True),
        null=True,
        blank=True,
    )
    archiefstatus = models.CharField("archiefstatus", max_length=250, blank=True)
    eigenschappen = ArrayField(
        models.URLField("eigenschappen", max_length=1000, blank=True),
        null=True,
        blank=True,
    )
    identificatie = models.CharField("identificatie", max_length=40, blank=True)
    processobject = models.JSONField("processobject", blank=True, null=True)
    zaakgeometrie = GeometryField("zaakgeometrie", blank=True, null=True)
    bronorganisatie = models.CharField("bronorganisatie", max_length=9)
    publicatiedatum = models.DateField("publicatiedatum", blank=True, null=True)
    archiefnominatie = models.CharField(
        "archiefnominatie", max_length=250, blank=True, null=True
    )
    einddatum_gepland = models.DateField("einddatum_gepland", blank=True, null=True)
    registratiedatum = models.DateField("registratiedatum", blank=True, null=True)
    archiefactiedatum = models.DateField("archiefactiedatum", blank=True, null=True)
    processobjectaard = models.CharField(
        "processobjectaard", max_length=200, blank=True
    )
    betalingsindicatie = models.CharField(
        "betalingsindicatie", max_length=250, blank=True
    )
    communicatiekanaal = models.URLField(
        "communicatiekanaal", max_length=1000, blank=True, null=True
    )
    laatste_betaaldatum = models.DateTimeField(
        "laatste betaaldatum", blank=True, null=True
    )
    producten_of_diensten = ArrayField(
        base_field=models.URLField(
            verbose_name="producten of diensten", max_length=1000, blank=True
        ),
        null=True,
        blank=True,
    )
    selectielijstklasse = models.URLField(
        "selectielijstklasse", max_length=1000, blank=True, null=True
    )
    relevante_andere_zaken = models.JSONField(
        "relevante andere zaken", blank=True, null=True
    )
    zaakinformatieobjecten = ArrayField(
        models.URLField("zaaktype", max_length=1000, blank=True),
        null=True,
        blank=True,
    )
    startdatum_bewaartermijn = models.DateField(
        "startdatum bewaartermijn", blank=True, null=True
    )
    betalingsindicatie_weergave = models.CharField(
        "betalingsindicatie weergave", max_length=250, blank=True
    )
    opdrachtgevende_organisatie = models.CharField(
        "opdrachtgevende organisatie", max_length=9, blank=True
    )
    vertrouwelijkheidaanduiding = models.CharField(
        "vertrouwelijkheidaanduiding", max_length=250, blank=True
    )
    uiterlijke_einddatum_afdoening = models.DateField(
        "uiterlijke einddatum afdoening", blank=True, null=True
    )
    verantwoordelijke_organisatie = models.CharField(
        "verantwoordelijke organisatie", max_length=9
    )
    _expand = models.JSONField("expand", blank=True, null=True, default=dict)

    class Meta:
        verbose_name = "Zaak"
        verbose_name_plural = "Zaken"

    def __str__(self):
        return self.identificatie

    def update_data(self, data: dict) -> None:
        from .api.serializers import ZaakSerializer

        zrc_service = Service.objects.get(api_type=APITypes.zrc)
        zrc_client = build_client(zrc_service)

        with zrc_client:
            response = zrc_client.patch(
                f"zaken/{self.uuid}",
                headers={
                    "Accept-Crs": "EPSG:4326",
                    "Content-Crs": "EPSG:4326",
                },
                json=data,
                timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            updated_zaak = response.json()

        serializer = ZaakSerializer(data=updated_zaak, partial=True, instance=self)
        serializer.is_valid(raise_exception=True)
        serializer.save()

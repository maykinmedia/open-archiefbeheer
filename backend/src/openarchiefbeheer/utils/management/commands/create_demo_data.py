from typing import Mapping, TypedDict

from django.core.management import BaseCommand

from zgw_consumers.constants import APITypes, AuthTypes
from zgw_consumers.models import Service

from ...tests.resources_client import (
    JSONEncodable,
    ObjectenCreationHelper,
    OpenKlantCreationHelper,
    OpenZaakDataCreationHelper,
)


class LocalServices(TypedDict):
    zrc_service: Service
    drc_service: Service
    ztc_service: Service
    objecten_service: Service
    openklant_service: Service


class Command(BaseCommand):
    """Create demo data locally.

    This command is for development purposes only. It relies on the docker compose environments
    (Open Zaak, Objecten and Open Klant) with which the development server of OAB can talk to.

    The ZGW services that OAB needs to talk to the registers are created/updated by this command.

    The following resources are created:

    * Open Zaak:

       * A (published) zaaktype with a related resultaattype, two statustypen and informatieobjecttype to configure the destruction report
       * 5 closed zaken related to a Chuck Norris quote (to simulate unsupported relations).

    * Objecten: 5 objects
    * Open Klant: 5 onderwerpobjecten

    The following resources are NOT created:

    * ZaakObjecten in Open Zaak to the objects in Objecten API and to the onderwerpobjecten in Open Klant. This is because the linkchecker in Open Zaak makes this impossible with the docker compose setup.

    """

    help = (
        "This command is for development purposes only. It relies on the docker compose environments "
        "(Open Zaak, Objecten and Open Klant) with which the development server of OAB can talk to."
    )

    def add_arguments(self, parser):
        super().add_arguments(parser)

        parser.add_argument(
            "--zaken",
            help="Configure the number of zaken that will be created. Defaults to 5.",
            default=5,
            type=int,
        )

    def _configure_services(self) -> LocalServices:
        """Create/update all ZGW services needed for the functioning of OAB."""
        self.stdout.write("Creating/updating the ZGW services in OAB...")

        ztc_service, _ = Service.objects.get_or_create(
            api_root="http://localhost:8003/catalogi/api/v1/",
            defaults={
                "slug": "catalogi",
                "api_type": APITypes.ztc,
                "client_id": "test-vcr",
                "secret": "test-vcr",
            },
        )
        zrc_service, _ = Service.objects.get_or_create(
            api_root="http://localhost:8003/zaken/api/v1/",
            defaults={
                "slug": "zaken",
                "api_type": APITypes.zrc,
                "client_id": "test-vcr",
                "secret": "test-vcr",
            },
        )
        Service.objects.update_or_create(
            api_root="http://localhost:8003/besluiten/api/v1/",
            defaults={
                "slug": "besluiten",
                "api_type": APITypes.brc,
                "client_id": "test-vcr",
                "secret": "test-vcr",
            },
        )
        drc_service, _ = Service.objects.get_or_create(
            api_root="http://localhost:8003/documenten/api/v1/",
            defaults={
                "slug": "documenten",
                "api_type": APITypes.drc,
                "client_id": "test-vcr",
                "secret": "test-vcr",
            },
        )
        Service.objects.update_or_create(
            api_root="https://selectielijst.openzaak.nl/api/v1/",
            defaults={
                "slug": "selectielijst",
                "api_type": APITypes.orc,
                "auth_type": AuthTypes.no_auth,
            },
        )
        objecten_service, _ = Service.objects.get_or_create(
            api_root="http://localhost:8006/api/v2/",
            defaults={
                "slug": "objecten",
                "api_type": APITypes.orc,
                "api_root": "http://localhost:8006/api/v2/",
                "auth_type": AuthTypes.api_key,
                "header_key": "Authorization",
                "header_value": "Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
            },
        )
        openklant_service, _ = Service.objects.get_or_create(
            api_root="http://localhost:8005/klantinteracties/api/v1/",
            defaults={
                "slug": "openklant",
                "api_type": APITypes.orc,
                "auth_type": AuthTypes.api_key,
                "header_key": "Authorization",
                "header_value": "Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
            },
        )

        return {
            "objecten_service": objecten_service,
            "openklant_service": openklant_service,
            "zrc_service": zrc_service,
            "ztc_service": ztc_service,
            "drc_service": drc_service,
        }

    def _generate_reources_for_destructionreport_config(
        self, helper: OpenZaakDataCreationHelper
    ) -> None:
        """Generate a zaaktype with a related resultaattype, two statustypen and informatieobjecttype

        These can be used to configure the destruction report settings."""

        self.stdout.write("Generating resources in Catalogi API...")

        resources = helper.create_zaaktype_with_relations(
            omschrijving="Destruction report"  # pyright: ignore[reportArgumentType]
        )
        assert isinstance(resources["zaaktype"]["url"], str) and isinstance(
            resources["zaaktype"]["catalogus"], str
        )
        iot = helper.create_informatieobjecttype(
            catalogus_url=resources["zaaktype"]["catalogus"]
        )
        assert isinstance(iot["url"], str)
        helper.relate_zaaktype_informatieobjecttype(
            informatieobjecttype_url=iot["url"],
            zaaktype_url=resources["zaaktype"]["url"],
        )
        helper.publish_informatieobjecttype(iot["url"])
        helper.publish_zaaktype(resources["zaaktype"]["url"])

    def _generate_zaken(
        self, helper: OpenZaakDataCreationHelper, number_of_zaken: int
    ) -> list[Mapping[str, JSONEncodable]]:
        """Generate closed zaken with unsupported relations that OAB can retrieve."""
        self.stdout.write("Generating zaken in Open Zaak...")

        resources = helper.create_zaaktype_with_relations(
            omschrijving="Demo data OAB"  # pyright: ignore[reportArgumentType]
        )
        assert isinstance(resources["zaaktype"]["url"], str)
        helper.publish_zaaktype(resources["zaaktype"]["url"])

        zaken = [
            helper.create_zaak(
                zaaktype_url=resources["zaaktype"]["url"]  # pyright: ignore[reportArgumentType]
            )
            for _ in range(number_of_zaken)
        ]

        # Add some unsupported relations. Chuck norris quotes!
        for zaak in zaken:
            assert isinstance(zaak["url"], str)
            helper.create_zaakobject(
                zaak_url=zaak["url"],
                object_url="https://api.chucknorris.io/jokes/3kcaD8EnSKuRHKAi9Lt8HQ",
                **{
                    "objectTypeOverige": "Chuck norris quote",
                    "objectIdentificatie": {"overigeData": "3kcaD8EnSKuRHKAi9Lt8HQ"},
                },
            )

        # Close the zaken.
        for zaak in zaken:
            statustypen = list(resources["statustypen"])
            assert (
                isinstance(zaak["url"], str)
                and isinstance(resources["resultaattype"]["url"], str)
                and isinstance(statustypen[1]["url"], str)
            )

            helper.close_zaak(
                zaak_url=zaak["url"],
                resultaattype_url=resources["resultaattype"]["url"],
                statustype_url=statustypen[1]["url"],
                toelichting="Demo OAB",
            )
        return zaken

    def _generate_objecten(
        self, helper: ObjectenCreationHelper
    ) -> list[Mapping[str, JSONEncodable]]:
        self.stdout.write("Generating objects in the Objecten API...")
        return [helper.create_object() for _ in range(5)]

    def _generate_onderwerpobjecten(
        self, helper: OpenKlantCreationHelper
    ) -> list[Mapping[str, JSONEncodable]]:
        self.stdout.write("Generating onderwerpobjecten in Open Klant...")
        return [helper.create_onderwerpobject() for _ in range(5)]

    def handle(self, *args, **options):
        services = self._configure_services()

        oz_helper = OpenZaakDataCreationHelper(
            zrc_service_slug=services["zrc_service"].slug,
            ztc_service_slug=services["ztc_service"].slug,
            drc_service_slug=services["drc_service"].slug,
        )
        objecten_helper = ObjectenCreationHelper(
            objecten_service_slug=services["objecten_service"].slug
        )
        openklant_helper = OpenKlantCreationHelper(
            openklant_service_slug=services["openklant_service"].slug
        )

        self._generate_reources_for_destructionreport_config(oz_helper)
        self._generate_zaken(oz_helper, number_of_zaken=options["zaken"])
        self._generate_objecten(objecten_helper)
        self._generate_onderwerpobjecten(openklant_helper)

        self.stdout.write(
            self.style.SUCCESS("Generated resources in the external registers!")
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Run src/manage.py resync_zaken to index the new zaken in OAB."
            )
        )

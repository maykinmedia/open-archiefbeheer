import string
from dataclasses import dataclass
from random import choice
from typing import ContextManager, Iterable, Mapping, Sequence, TypedDict

from ape_pie import APIClient
from faker import Faker
from faker.providers import lorem
from furl import furl
from zgw_consumers.client import build_client
from zgw_consumers.models import Service

from openarchiefbeheer.clients import drc_client, zrc_client, ztc_client

faker = Faker()
faker.add_provider(lorem)

type JSONEncodable = (
    None
    | bool
    | int
    | float
    | str
    | Sequence[JSONEncodable]
    | Mapping[str, JSONEncodable]
)


class ZaaktypeWithRelations(TypedDict):
    zaaktype: Mapping[str, JSONEncodable]
    roltype: Mapping[str, JSONEncodable]
    resultaattype: Mapping[str, JSONEncodable]
    statustypen: Iterable[Mapping[str, JSONEncodable]]


@dataclass
class OpenZaakDataCreationHelper:
    zrc_service_slug: str = ""
    ztc_service_slug: str = ""
    drc_service_slug: str = ""
    openklant_service_slug: str = ""

    def _create_resource(
        self,
        data: Mapping[str, JSONEncodable],
        resource_path: str,
        client_cm: ContextManager[APIClient],
    ) -> Mapping[str, JSONEncodable]:
        with client_cm as client:
            response = client.post(
                resource_path,
                json=data,
                headers={
                    "Accept-Crs": "EPSG:4326",
                    "Content-Crs": "EPSG:4326",
                },
            )

            if response.status_code == 400:
                raise Exception(response.content)

            response.raise_for_status()

        return response.json()

    def create_zaak(
        self, zaaktype_url: str = "", **overrides: Mapping[str, JSONEncodable]
    ) -> Mapping[str, JSONEncodable]:
        if not zaaktype_url:
            zaaktype = self.create_zaaktype()
            assert isinstance(zaaktype, dict) and isinstance(zaaktype["url"], str)
            zaaktype_url = zaaktype["url"]

        data: Mapping[str, JSONEncodable] = {
            "zaaktype": zaaktype_url,
            "bronorganisatie": "123456782",
            "verantwoordelijkeOrganisatie": "123456782",
            "startdatum": "2000-01-01",
            "archiefnominatie": "vernietigen",
            "archiefactiedatum": "2020-01-01",
        }

        return self._create_resource(
            data | overrides, "zaken", zrc_client(self.zrc_service_slug)
        )

    def _get_catalogus(self, catalogus_url="", **_) -> str:
        if catalogus_url:
            return catalogus_url

        catalogus = self.create_catalogus()
        assert isinstance(catalogus, dict)
        catalogus_url = catalogus["url"]
        assert isinstance(catalogus_url, str)
        return catalogus_url

    def create_catalogus(
        self, **overrides: Mapping[str, JSONEncodable]
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "domein": "".join([choice(string.ascii_uppercase) for _ in range(5)]),
            "rsin": "123456782",
            "contactpersoonBeheerNaam": "Ubaldo",
            "naam": faker.sentence(),
        } | overrides

        return self._create_resource(
            data, "catalogussen", ztc_client(self.ztc_service_slug)
        )

    def create_zaaktype_with_relations(
        self,
        catalogus_url: str = "",
        **zaaktype_overrides: Mapping[str, JSONEncodable],
    ) -> ZaaktypeWithRelations:
        zaaktype = self.create_zaaktype(catalogus_url, **zaaktype_overrides)
        assert isinstance(zaaktype["url"], str)

        roltype = self.create_roltype(zaaktype_url=zaaktype["url"])
        resultaattype = self.create_resultaattype(zaaktype_url=zaaktype["url"])
        statustype1 = self.create_statustype(
            zaaktype_url=zaaktype["url"],
            **{"omschrijving": "begin", "volgnummer": 1},
        )
        statustype2 = self.create_statustype(
            zaaktype_url=zaaktype["url"],
            **{"omschrijving": "eind", "volgnummer": 2},
        )

        return {
            "zaaktype": zaaktype,
            "resultaattype": resultaattype,
            "statustypen": [statustype1, statustype2],
            "roltype": roltype,
        }

    def publish_zaaktype(self, zaaktype_url: str) -> None:
        with ztc_client(self.ztc_service_slug) as client:
            uuid = furl(zaaktype_url).path.segments[-1]
            response = client.post(f"zaaktypen/{uuid}/publish")

            if response.status_code == 400:
                raise Exception(response.json())

            response.raise_for_status()

    def create_zaaktype(
        self, catalogus: str = "", **overrides: Mapping[str, JSONEncodable]
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "omschrijving": faker.sentence(),
            "vertrouwelijkheidaanduiding": "geheim",
            "doel": "New Zaaktype 001",
            "aanleiding": "New Zaaktype 001",
            "indicatieInternOfExtern": "intern",
            "handelingInitiator": "aanvragen",
            "onderwerp": "New Zaaktype 001",
            "handelingBehandelaar": "handelin",
            "doorlooptijd": "P40D",
            "opschortingEnAanhoudingMogelijk": False,
            "verlengingMogelijk": True,
            "verlengingstermijn": "P40D",
            "publicatieIndicatie": False,
            "productenOfDiensten": ["https://example.com/product/321"],
            "referentieproces": {"naam": "ReferentieProces 1"},
            "verantwoordelijke": "200000000",
            "beginGeldigheid": "2025-06-19",
            "versiedatum": "2025-06-19",
            "catalogus": self._get_catalogus(catalogus),
            "besluittypen": [],
            "gerelateerdeZaaktypen": [],
            "selectielijstProcestype": "https://selectielijst.openzaak.nl/api/v1/procestypen/aa8aa2fd-b9c6-4e34-9a6c-58a677f60ea0",
        } | overrides

        return self._create_resource(
            data, "zaaktypen", ztc_client(self.ztc_service_slug)
        )

    def create_roltype(
        self,
        zaaktype_url: str = "",
        **overrides: Mapping[str, JSONEncodable],
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "zaaktype": zaaktype_url,
            "omschrijving": "Vastgesteld",
            "omschrijvingGeneriek": "adviseur",
            **overrides,
        }
        return self._create_resource(
            data, "roltypen", ztc_client(self.ztc_service_slug)
        )

    def create_statustype(
        self, zaaktype_url: str = "", **overrides: Mapping[str, JSONEncodable]
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "omschrijving": "Ontvangen",
            "zaaktype": zaaktype_url,
            "volgnummer": 1,
            "omschrijving_generiek": "",
            "statustekst": "",
            "informeren": False,
            "checklistitem_statustype": [],
        } | overrides

        return self._create_resource(
            data, "statustypen", ztc_client(self.ztc_service_slug)
        )

    def create_resultaattype(
        self,
        zaaktype_url: str = "",
        **overrides: Mapping[str, JSONEncodable],
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "zaaktype": zaaktype_url,
            "omschrijving": "Gegrond",
            "resultaattypeomschrijving": "https://selectielijst.openzaak.nl/api/v1/resultaattypeomschrijvingen/3a0a9c3c-0847-4e7e-b7d9-765b9434094c",
            "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/8af64c99-a168-40dd-8afd-9fbe0597b6dc",
            "archiefnominatie": "vernietigen",
            "brondatumArchiefprocedure": {
                "afleidingswijze": "afgehandeld",
                "procestermijn": None,
                "datumkenmerk": "",
                "einddatumBekend": False,
                "objecttype": "",
                "registratie": "",
            },
        } | overrides

        return self._create_resource(
            data, "resultaattypen", ztc_client(self.ztc_service_slug)
        )

    def create_informatieobjecttype(
        self, catalogus_url: str = "", **overrides: Mapping[str, JSONEncodable]
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "catalogus": catalogus_url,
            "omschrijving": "Omschrijving A",
            "vertrouwelijkheidaanduiding": "openbaar",
            "beginGeldigheid": "2025-07-01",
            "informatieobjectcategorie": "Blue",
        } | overrides

        return self._create_resource(
            data, "informatieobjecttypen", ztc_client(self.ztc_service_slug)
        )

    def create_zaakobjecttype(
        self,
        zaaktype_url: str,
        objecttype_url: str,
        **overrides: Mapping[str, JSONEncodable],
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "anderObjecttype": False,
            "objecttype": objecttype_url,
            "relatieOmschrijving": "Some relation",
            "zaaktype": zaaktype_url,
        } | overrides

        return self._create_resource(
            data, "zaakobjecttypen", ztc_client(self.ztc_service_slug)
        )

    def relate_zaaktype_informatieobjecttype(
        self,
        zaaktype_url: str,
        informatieobjecttype_url: str,
        **overrides: Mapping[str, JSONEncodable],
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "zaaktype": zaaktype_url,
            "informatieobjecttype": informatieobjecttype_url,
            "volgnummer": 1,
            "richting": "inkomend",
        } | overrides

        return self._create_resource(
            data, "zaaktype-informatieobjecttypen", ztc_client(self.ztc_service_slug)
        )

    def create_zaakobject(
        self,
        zaak_url: str,
        object_url: str,
        **overrides: Mapping[str, JSONEncodable],
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "zaak": zaak_url,
            "objectType": "overige",
            "object": object_url,
            "objectTypeOverige": "A description of the type",
            "objectIdentificatie": {"overigeData": "Bla"},
        } | overrides

        return self._create_resource(
            data, "zaakobjecten", zrc_client(self.zrc_service_slug)
        )

    def create_enkelvoudiginformatieobject(
        self, informatieobjecttype_url: str, **overrides: Mapping[str, JSONEncodable]
    ):
        data: Mapping[str, JSONEncodable] = {
            "bronorganisatie": "000000000",
            "creatiedatum": "2020-01-01",
            "titel": "Report on testing",
            "auteur": "OAB test tool",
            "taal": "dut",
            "informatieobjecttype": informatieobjecttype_url,
        } | overrides

        return self._create_resource(
            data, "enkelvoudiginformatieobjecten", drc_client(self.drc_service_slug)
        )

    def create_klantcontact(
        self, **overrides: Mapping[str, JSONEncodable]
    ) -> Mapping[str, JSONEncodable]:
        data: Mapping[str, JSONEncodable] = {
            "kanaal": "telefoon",
            "onderwerp": "Testing",
            "taal": "dut",
            "vertrouwelijk": False,
        } | overrides

        return self._create_resource(
            data,
            "klantcontacten",
            build_client(Service.objects.get(slug=self.openklant_service_slug)),
        )

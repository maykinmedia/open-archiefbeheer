from django.test import TestCase, tag

from vcr.unittest import VCRMixin
from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.utils.results_store import ResultStore
from openarchiefbeheer.utils.utils_decorators import reload_openzaak_fixture

from ...models import Zaak
from ...tasks import retrieve_and_cache_zaken_from_openzaak
from ...utils import delete_zaak_and_related_objects


@tag("vcr")
class DeletingZakenTests(VCRMixin, TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.drc_service = ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.brc_service = ServiceFactory.create(
            api_type=APITypes.brc,
            api_root="http://localhost:8003/besluiten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

    @reload_openzaak_fixture("complex_relations.json")
    def test_delete_zaak_related_to_besluit_related_to_document(self):
        retrieve_and_cache_zaken_from_openzaak()

        zaak = Zaak.objects.get(identificatie="ZAAK-00")
        destruction_list_item = DestructionListItemFactory.create(
            zaak_url=zaak.url, zaak=zaak
        )
        result_store = ResultStore(store=destruction_list_item)

        delete_zaak_and_related_objects(zaak, result_store)

        zrc_service = Service.objects.get(api_type=APITypes.zrc)
        zrc_client = build_client(zrc_service)

        with zrc_client:
            response = zrc_client.get("zaken", headers={"Accept-Crs": "EPSG:4326"})
            response.raise_for_status()

            data = response.json()

            self.assertEqual(data["count"], 1)
            self.assertEqual(data["results"][0]["identificatie"], "ZAAK-01")

        drc_service = Service.objects.get(api_type=APITypes.drc)
        drc_client = build_client(drc_service)
        with drc_client:
            response = drc_client.get("enkelvoudiginformatieobjecten")
            response.raise_for_status()

            data = response.json()

            self.assertEqual(data["count"], 2)

            identificaties = [item["identificatie"] for item in data["results"]]

            self.assertIn("DOCUMENT-01", identificaties)
            self.assertIn("DOCUMENT-03", identificaties)

        brc_service = Service.objects.get(api_type=APITypes.brc)
        brc_client = build_client(brc_service)
        with brc_client:
            response = brc_client.get("besluiten")
            response.raise_for_status()

            data = response.json()

            self.assertEqual(data["count"], 1)
            self.assertEqual(data["results"][0]["identificatie"], "BESLUIT-02")

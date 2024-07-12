from django.test import TestCase

from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.utils.results_store import ResultStore

from ...models import Zaak
from ...tasks import retrieve_and_cache_zaken_from_openzaak
from ...utils import delete_zaak_and_related_objects


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

    def setUp(self) -> None:
        super().setUp()

        retrieve_and_cache_zaken_from_openzaak()

    def test_deleting_zaak_without_besluiten(self):
        zaak = Zaak.objects.get(identificatie="ZAAK_4")
        destruction_list_item = DestructionListItemFactory.create(zaak=zaak.url)
        result_store = ResultStore(store=destruction_list_item)

        delete_zaak_and_related_objects(zaak, result_store)

    def test_deleting_zaak_with_document_related_to_other_besluit(self):
        zaak = Zaak.objects.get(identificatie="ZAAK_5")
        destruction_list_item = DestructionListItemFactory.create(zaak=zaak.url)
        result_store = ResultStore(store=destruction_list_item)

        delete_zaak_and_related_objects(zaak, result_store)

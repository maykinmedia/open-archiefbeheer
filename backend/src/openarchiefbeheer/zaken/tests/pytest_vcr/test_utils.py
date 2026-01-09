import pytest
from freezegun import freeze_time
from vcr.cassette import Cassette
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.clients import brc_client, drc_client, zrc_client
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.utils.results_store import ResultStore

from ...models import Zaak
from ...tasks import retrieve_and_cache_zaken_from_openzaak
from ...utils import delete_zaak_and_related_objects


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["complex_relations.json"])
def test_delete_zaak_related_to_besluit_related_to_document(
    openzaak_reload: None, vcr: Cassette
):
    ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.drc,
        api_root="http://localhost:8003/documenten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.brc,
        api_root="http://localhost:8003/besluiten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    with freeze_time("2024-08-29T16:00:00+02:00"):
        retrieve_and_cache_zaken_from_openzaak()

    assert Zaak.objects.count() == 2
    zaak = Zaak.objects.get(identificatie="ZAAK-00")
    destruction_list_item = DestructionListItemFactory.create(zaak=zaak)
    result_store = ResultStore(store=destruction_list_item)

    delete_zaak_and_related_objects(
        destruction_list_item.zaak, excluded_relations=[], result_store=result_store
    )

    with zrc_client() as client:
        response = client.get("zaken", headers={"Accept-Crs": "EPSG:4326"})
        response.raise_for_status()

        data = response.json()

        assert data["count"] == 1

    with drc_client() as client:
        response = client.get("enkelvoudiginformatieobjecten")
        response.raise_for_status()

        data = response.json()

        assert data["count"] == 2

        identificaties = [item["identificatie"] for item in data["results"]]

        assert "DOCUMENT-01" in identificaties
        assert "DOCUMENT-03" in identificaties

    with brc_client() as client:
        response = client.get("besluiten")
        response.raise_for_status()

        data = response.json()

        assert data["count"] == 1
        assert data["results"][0]["identificatie"] == "BESLUIT-02"

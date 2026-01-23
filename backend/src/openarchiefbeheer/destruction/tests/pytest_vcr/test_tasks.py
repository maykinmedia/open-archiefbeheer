import pytest
from freezegun import freeze_time
from vcr.cassette import Cassette
from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.clients import brc_client, drc_client, zrc_client
from openarchiefbeheer.config.tests.factories import APIConfigFactory
from openarchiefbeheer.destruction.models import ResourceDestructionResult
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tasks import (
    retrieve_and_cache_zaken_from_openzaak,
)

from ...constants import (
    DestructionListItemAction,
    InternalStatus,
    ListRole,
    ListStatus,
    ResourceDestructionResultStatus,
)
from ...tasks import (
    complete_and_notify,
    delete_destruction_list_item,
    process_review_response,
)
from ..factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    ReviewItemResponseFactory,
    ReviewResponseFactory,
)


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["complex_relations.json", "zaken.json"])
def test_process_review_response(openzaak_reload: None, vcr: Cassette):
    zrc_service = ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )

    with freeze_time("2024-08-29T16:00:00+02:00"):
        retrieve_and_cache_zaken_from_openzaak()

    record_manager = UserFactory.create(post__can_start_destruction=True)
    reviewer = UserFactory.create(
        post__can_review_destruction=True,
    )
    zaak = Zaak.objects.get(identificatie="ZAAK-01")

    destruction_list = DestructionListFactory.create(
        author=record_manager, status=ListStatus.changes_requested
    )
    item = DestructionListItemFactory.create(
        zaak=zaak,
        destruction_list=destruction_list,
    )
    DestructionListAssigneeFactory.create(
        user=record_manager,
        role=ListRole.author,
        destruction_list=destruction_list,
    )
    DestructionListAssigneeFactory.create(
        user=reviewer,
        role=ListRole.main_reviewer,
        destruction_list=destruction_list,
    )
    review_response = ReviewResponseFactory.create(
        review__destruction_list=destruction_list,
        review__author=reviewer,
    )
    ReviewItemResponseFactory.create(
        review_item__destruction_list_item__zaak=item.zaak,
        review_item__review=review_response.review,
        action_item=DestructionListItemAction.remove,
        action_zaak={"archiefactiedatum": "2024-10-01"},
    )

    process_review_response(review_response.pk)

    zaak = item.zaak
    zaak.refresh_from_db()

    assert zaak.archiefactiedatum.isoformat() == "2024-10-01"

    zrc_client = build_client(zrc_service)
    with zrc_client:
        response = zrc_client.get(
            f"zaken/{zaak.uuid}",
            headers={"Accept-Crs": "EPSG:4326"},
        )
        response.raise_for_status()

    zaak_data = response.json()

    assert zaak_data["archiefactiedatum"] == "2024-10-01"


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["complex_relations.json", "zaken.json"])
def test_document_deleted(openzaak_reload: None, vcr: Cassette):
    """
    Issue 594: Test deletion race conditions

    After a relation object (ZIO/BIO) is deleted by OAB and before the
    corresponding EIO is deleted by OAB, someone deletes the EIO in OZ.
    """
    ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.ztc,
        api_root="http://localhost:8003/catalogi/api/v1",
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
    APIConfigFactory.create()

    with freeze_time("2024-08-29T16:00:00+02:00"):
        retrieve_and_cache_zaken_from_openzaak()

    destruction_list = DestructionListFactory.create(
        status=ListStatus.ready_to_delete, processing_status=InternalStatus.failed
    )
    zaak = Zaak.objects.get(identificatie="ZAAK-01")
    item = DestructionListItemFactory.create(
        zaak=zaak,
        destruction_list=destruction_list,
        processing_status=InternalStatus.failed,
    )
    ResourceDestructionResult.objects.create(
        item=item,
        resource_type="enkelvoudiginformatieobjecten",
        # Doesn't exist in OZ
        url="http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/f808f32f-1507-4f00-90f8-0e382cbd40c0",
        status=ResourceDestructionResultStatus.to_be_deleted,
    )

    delete_destruction_list_item(item.pk)

    item.refresh_from_db()

    assert item.processing_status == InternalStatus.succeeded


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

    delete_destruction_list_item(destruction_list_item.pk)

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


@pytest.mark.django_db
def test_zaak_creation_skipped_if_internal_status_succeeded(vcr: Cassette):
    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.succeeded
    )

    complete_and_notify(destruction_list.pk)

    assert len(vcr.requests) == 0

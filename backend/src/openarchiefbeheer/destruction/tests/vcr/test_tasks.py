from django.test import TestCase, tag

from freezegun import freeze_time
from vcr.unittest import VCRMixin
from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.utils.utils_decorators import reload_openzaak_fixtures
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tasks import retrieve_and_cache_zaken_from_openzaak

from ...constants import DestructionListItemAction, ListRole, ListStatus
from ...tasks import process_review_response
from ..factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    ReviewItemResponseFactory,
    ReviewResponseFactory,
)


@tag("vcr")
class ProcessResponseTest(VCRMixin, TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

    @reload_openzaak_fixtures()
    def test_process_response(self):
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

        self.assertEqual(zaak.archiefactiedatum.isoformat(), "2024-10-01")

        zrc_client = build_client(self.zrc_service)
        with zrc_client:
            response = zrc_client.get(
                f"zaken/{zaak.uuid}",
                headers={"Accept-Crs": "EPSG:4326"},
            )
            response.raise_for_status()

        zaak_data = response.json()

        self.assertEqual(zaak_data["archiefactiedatum"], "2024-10-01")

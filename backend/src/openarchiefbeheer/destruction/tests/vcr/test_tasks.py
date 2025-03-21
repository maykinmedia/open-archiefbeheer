from django.core.cache import cache
from django.test import TestCase, override_settings, tag

from freezegun import freeze_time
from timeline_logger.models import TimelineLog
from vcr.unittest import VCRMixin
from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.models import APIConfig, ArchiveConfig
from openarchiefbeheer.utils.utils_decorators import reload_openzaak_fixtures
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tasks import retrieve_and_cache_zaken_from_openzaak

from ...constants import DestructionListItemAction, InternalStatus, ListRole, ListStatus
from ...tasks import delete_destruction_list, process_review_response
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


@tag("vcr")
class DestructionTest(VCRMixin, TestCase):
    def setUp(self):
        super().setUp()

        cache.clear()

        self.addCleanup(cache.clear)

    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.ztc_service = ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.drc_service = ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.drc_service = ServiceFactory.create(
            api_type=APITypes.brc,
            api_root="http://localhost:8003/besluiten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.selectielijst_service = ServiceFactory(
            slug="selectielijst",
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1/",
        )

    @reload_openzaak_fixtures()
    def test_document_deleted(self):
        """
        Issue 594: Test deletion race conditions

        After a relation object (ZIO/BIO) is deleted by OAB and before the
        corresponding EIO is deleted by OAB, someone deletes the EIO in OZ.
        """
        config = APIConfig.get_solo()
        config.selectielijst_api_service = self.selectielijst_service
        config.save()

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
            internal_results={
                "resources_to_delete": {
                    "enkelvoudiginformatieobjecten": [
                        # Doesn't exist in OZ
                        "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/f808f32f-1507-4f00-90f8-0e382cbd40c0"
                    ]
                }
            },
        )

        item.process_deletion()

        item.refresh_from_db()

        self.assertEqual(item.processing_status, InternalStatus.succeeded)

    @reload_openzaak_fixtures()
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_delete_list(self):
        """
        Issue 770: the zaaktype is an identificatie instead of a URL
        """
        config = APIConfig.get_solo()
        config.selectielijst_api_service = self.selectielijst_service
        config.save()

        with freeze_time("2024-08-29T16:00:00+02:00"):
            retrieve_and_cache_zaken_from_openzaak()

        zaak = Zaak.objects.get(identificatie="ZAAK-01")

        record_manager = UserFactory.create()
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete
        )
        DestructionListItemFactory.create(zaak=zaak, destruction_list=destruction_list)

        TimelineLog.objects.create(
            content_object=destruction_list,
            template="logging/destruction_list_deletion_triggered.txt",
            extra_data={
                "user": {"username": record_manager.username},
                "user_groups": [],
            },
            user=record_manager,
        )

        config = ArchiveConfig.get_solo()
        config.bronorganisatie = "000000000"
        config.zaaktype = "ZAAKTYPE-2018-0000000002"
        config.statustype = "http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016"
        config.resultaattype = "http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e"
        config.informatieobjecttype = "http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485"
        config.save()

        delete_destruction_list(destruction_list)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.deleted)
        self.assertEqual(destruction_list.processing_status, InternalStatus.succeeded)

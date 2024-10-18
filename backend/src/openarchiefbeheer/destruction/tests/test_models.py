from datetime import date, datetime
from unittest.mock import patch

from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase
from django.utils import timezone

from freezegun import freeze_time
from privates.test import temp_private_root
from requests import HTTPError
from requests_mock import Mocker
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.utils.results_store import ResultStore
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import InternalStatus, ListItemStatus, ListStatus
from .factories import (
    DestructionListFactory,
    DestructionListItemFactory,
    ReviewResponseFactory,
)


class DestructionListItemTest(TestCase):
    def test_set_status(self):
        destruction_list = DestructionListFactory.create()

        with freeze_time("2024-05-02T16:00:00+02:00"):
            destruction_list.set_status(ListItemStatus.removed)

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.status_changed,
            timezone.make_aware(datetime(2024, 5, 2, 16, 0)),
        )

    def test_process_deletion_zaak_not_found(self):
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
        )

        item.process_deletion()

        item.refresh_from_db()

        self.assertEqual(item.processing_status, InternalStatus.failed)

    def test_process_deletion(self):
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            zaak__omschrijving="Test description",
        )

        with patch(
            "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects"
        ) as m_delete_in_openzaak:
            item.process_deletion()

        m_delete_in_openzaak.assert_called_once()
        kwargs = m_delete_in_openzaak.call_args_list[0].kwargs
        self.assertEqual(kwargs["zaak"].url, "http://zaken.nl/api/v1/zaken/111-111-111")
        self.assertEqual(kwargs["result_store"].store.pk, item.pk)

        item.refresh_from_db()

        self.assertEqual(item.processing_status, InternalStatus.succeeded)

        with self.assertRaises(ObjectDoesNotExist):
            Zaak.objects.get(url="http://zaken.nl/api/v1/zaken/111-111-111")

    def test_keeping_zaak_url_in_sync(self):
        zaak = ZaakFactory.create(url="http://zaken.nl/1")
        item = DestructionListItemFactory.create(
            with_zaak=True, zaak__url="http://zaken.nl/2"
        )

        self.assertEqual(item._zaak_url, "http://zaken.nl/2")

        item.zaak = zaak
        item.save()

        item.refresh_from_db()

        self.assertEqual(item._zaak_url, "http://zaken.nl/1")

    def test_zaak_data_present_after_deletion(self):
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            zaak__omschrijving="Test description",
            zaak__zaaktype="http://catalogi.nl/api/v1/zaaktypen/111-111-111",
            zaak__identificatie="ZAAK-01",
            zaak__startdatum=date(2020, 1, 1),
            zaak__einddatum=date(2022, 1, 1),
            zaak__resultaat="http://zaken.nl/api/v1/resultaten/111-111-111",
        )

        with patch(
            "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects"
        ):
            item.process_deletion()

        item.refresh_from_db()

        self.assertEqual(item.processing_status, InternalStatus.succeeded)
        self.assertEqual(
            item.extra_zaak_data["url"], "http://zaken.nl/api/v1/zaken/111-111-111"
        )
        self.assertEqual(item.extra_zaak_data["omschrijving"], "Test description")
        self.assertEqual(item.extra_zaak_data["identificatie"], "ZAAK-01")
        self.assertEqual(item.extra_zaak_data["startdatum"], "2020-01-01")
        self.assertEqual(item.extra_zaak_data["einddatum"], "2022-01-01")
        self.assertEqual(
            item.extra_zaak_data["zaaktype"],
            {
                "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                "omschrijving": "Aangifte behandelen",
                "selectielijst_procestype": {"nummer": 1},
            },
        )
        self.assertEqual(
            item.extra_zaak_data["resultaat"],
            "http://zaken.nl/api/v1/resultaten/111-111-111",
        )


class ReviewResponseTests(TestCase):
    def test_derive_status(self):
        review_response = ReviewResponseFactory.create()

        self.assertEqual(
            review_response._derive_status(
                [InternalStatus.new, InternalStatus.new, InternalStatus.new]
            ),
            InternalStatus.new,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                ]
            ),
            InternalStatus.succeeded,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.failed,
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                ]
            ),
            InternalStatus.failed,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.processing,
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                ]
            ),
            InternalStatus.processing,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.queued,
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                ]
            ),
            InternalStatus.queued,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.queued,
                    InternalStatus.failed,
                    InternalStatus.processing,
                ]
            ),
            InternalStatus.failed,
        )
        self.assertEqual(
            review_response._derive_status(
                [InternalStatus.queued, InternalStatus.new, InternalStatus.processing]
            ),
            InternalStatus.processing,
        )
        self.assertEqual(
            review_response._derive_status(
                [InternalStatus.new, InternalStatus.new, InternalStatus.succeeded]
            ),
            InternalStatus.processing,
        )


TEST_DATA_ARCHIVE_CONFIG = {
    "bronorganisatie": "000000000",
    "zaaktype": "http://localhost:8003/catalogi/api/v1/zaaktypen/ecd08880-5081-4d7a-afc3-ade1d6e6346f",
    "statustype": "http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
    "informatieobjecttype": "http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
    "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/e939c1ad-32e4-409b-a716-6d7d6e7df892",
}


@temp_private_root()
class DestructionListTest(TestCase):
    def test_has_long_review_process(self):
        destruction_list = DestructionListFactory.create()

        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/1",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/1",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/2",
        )

        with patch(
            "openarchiefbeheer.destruction.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(
                zaaktypes_short_process=["http://catalogi-api.nl/zaaktype/1"]
            ),
        ):
            has_short_review_process = destruction_list.has_short_review_process()

        self.assertFalse(has_short_review_process)

    def test_has_short_review_process(self):
        destruction_list = DestructionListFactory.create()

        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/1",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/1",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/2",
        )

        with patch(
            "openarchiefbeheer.destruction.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(
                zaaktypes_short_process=[
                    "http://catalogi-api.nl/zaaktype/1",
                    "http://catalogi-api.nl/zaaktype/2",
                ]
            ),
        ):
            has_short_review_process = destruction_list.has_short_review_process()

        self.assertTrue(has_short_review_process)

    def test_generate_destruction_report(self):
        destruction_list = DestructionListFactory.create(status=ListStatus.deleted)
        DestructionListItemFactory.create(
            processing_status=InternalStatus.succeeded,
            destruction_list=destruction_list,
            extra_zaak_data={
                "url": "http://zaken.nl/api/v1/zaken/111-111-111",
                "omschrijving": "Test description 1",
                "identificatie": "ZAAK-01",
                "startdatum": "2020-01-01",
                "einddatum": "2022-01-01",
                "resultaat": "http://zaken.nl/api/v1/resultaten/111-111-111",
                "zaaktype": {
                    "url": "http://catalogi.nl/api/v1/zaaktypen/111-111-111",
                    "omschrijving": "Tralala zaaktype",
                    "selectielijst_procestype": {
                        "nummer": 1,
                    },
                },
            },
        )
        DestructionListItemFactory.create(
            processing_status=InternalStatus.succeeded,
            destruction_list=destruction_list,
            extra_zaak_data={
                "url": "http://zaken.nl/api/v1/zaken/111-111-222",
                "omschrijving": "Test description 2",
                "identificatie": "ZAAK-02",
                "startdatum": "2020-01-02",
                "einddatum": "2022-01-02",
                "resultaat": "http://zaken.nl/api/v1/resultaten/111-111-222",
                "zaaktype": {
                    "url": "http://catalogi.nl/api/v1/zaaktypen/111-111-111",
                    "omschrijving": "Tralala zaaktype",
                    "selectielijst_procestype": {
                        "nummer": 1,
                    },
                },
            },
        )
        DestructionListItemFactory.create(
            processing_status=InternalStatus.succeeded,
            destruction_list=destruction_list,
            extra_zaak_data={
                "url": "http://zaken.nl/api/v1/zaken/111-111-333",
                "omschrijving": "Test description 3",
                "identificatie": "ZAAK-03",
                "startdatum": "2020-01-03",
                "einddatum": "2022-01-03",
                "resultaat": "http://zaken.nl/api/v1/resultaten/111-111-333",
                "zaaktype": {
                    "url": "http://catalogi.nl/api/v1/zaaktypen/111-111-222",
                    "omschrijving": "Tralala zaaktype",
                    "selectielijst_procestype": {
                        "nummer": 2,
                    },
                },
            },
        )

        destruction_list.generate_destruction_report()

        destruction_list.refresh_from_db()

        destruction_list.destruction_report
        lines = [line for line in destruction_list.destruction_report.readlines()]

        self.assertEqual(len(lines), 4)
        self.assertEqual(
            lines[0],
            b"url,einddatum,resultaat,startdatum,omschrijving,identificatie,zaaktype url,zaaktype omschrijving,selectielijst procestype nummer\n",
        )
        self.assertEqual(
            lines[1],
            b"http://zaken.nl/api/v1/zaken/111-111-111,2022-01-01,http://zaken.nl/api/v1/resultaten/111-111-111,2020-01-01,Test description 1,ZAAK-01,http://catalogi.nl/api/v1/zaaktypen/111-111-111,Tralala zaaktype,1\n",
        )
        self.assertEqual(
            lines[2],
            b"http://zaken.nl/api/v1/zaken/111-111-222,2022-01-02,http://zaken.nl/api/v1/resultaten/111-111-222,2020-01-02,Test description 2,ZAAK-02,http://catalogi.nl/api/v1/zaaktypen/111-111-111,Tralala zaaktype,1\n",
        )
        self.assertEqual(
            lines[3],
            b"http://zaken.nl/api/v1/zaken/111-111-333,2022-01-03,http://zaken.nl/api/v1/resultaten/111-111-333,2020-01-03,Test description 3,ZAAK-03,http://catalogi.nl/api/v1/zaaktypen/111-111-222,Tralala zaaktype,2\n",
        )

    def test_zaak_creation_skipped_if_internal_status_succeeded(self):
        destruction_list = DestructionListFactory.create(
            processing_status=InternalStatus.succeeded
        )

        with patch(
            "openarchiefbeheer.destruction.utils.create_zaak_for_report"
        ) as m_zaak:
            destruction_list.create_report_zaak()

        m_zaak.assert_not_called()

    @Mocker()
    def test_failure_during_zaak_creation(self, m):
        destruction_list = DestructionListFactory.create()
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )

        m.post("http://localhost:8003/zaken/api/v1/zaken", status_code=500)

        with (
            patch(
                "openarchiefbeheer.destruction.utils.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(**TEST_DATA_ARCHIVE_CONFIG),
            ),
            self.assertRaises(HTTPError),
        ):
            destruction_list.create_report_zaak()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.zaak_destruction_report_url, "")

    @Mocker()
    def test_failure_result_creation(self, m):
        destruction_list = DestructionListFactory.create()
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )

        m.post(
            "http://localhost:8003/zaken/api/v1/zaken",
            json={"url": "http://localhost:8003/zaken/api/v1/zaken/111-111-111"},
        )
        m.post("http://localhost:8003/zaken/api/v1/resultaten", status_code=500)

        with (
            patch(
                "openarchiefbeheer.destruction.utils.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(**TEST_DATA_ARCHIVE_CONFIG),
            ),
            self.assertRaises(HTTPError),
        ):
            destruction_list.create_report_zaak()

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.zaak_destruction_report_url,
            "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )

    @Mocker()
    def test_failure_status_creation(self, m):
        destruction_list = DestructionListFactory.create()
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )

        m.post(
            "http://localhost:8003/zaken/api/v1/zaken",
            json={"url": "http://localhost:8003/zaken/api/v1/zaken/111-111-111"},
        )
        m.post(
            "http://localhost:8003/zaken/api/v1/resultaten",
            json={"url": "http://localhost:8003/zaken/api/v1/resultaten/111-111-111"},
        )
        m.post("http://localhost:8003/zaken/api/v1/statussen", status_code=500)

        with (
            patch(
                "openarchiefbeheer.destruction.utils.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(**TEST_DATA_ARCHIVE_CONFIG),
            ),
            self.assertRaises(HTTPError),
        ):
            destruction_list.create_report_zaak()

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.zaak_destruction_report_url,
            "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        self.assertEqual(
            destruction_list.internal_results["created_resources"]["resultaten"],
            ["http://localhost:8003/zaken/api/v1/resultaten/111-111-111"],
        )

    @Mocker()
    def test_failure_document_creation(self, m):
        destruction_list = DestructionListFactory.create(with_report=True)
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )
        ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
        )

        m.post(
            "http://localhost:8003/zaken/api/v1/zaken",
            json={"url": "http://localhost:8003/zaken/api/v1/zaken/111-111-111"},
        )
        m.post(
            "http://localhost:8003/zaken/api/v1/resultaten",
            json={"url": "http://localhost:8003/zaken/api/v1/resultaten/111-111-111"},
        )
        m.post(
            "http://localhost:8003/zaken/api/v1/statussen",
            json={"url": "http://localhost:8003/zaken/api/v1/statussen/111-111-111"},
        )
        m.post(
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten",
            status_code=500,
        )

        with (
            patch(
                "openarchiefbeheer.destruction.utils.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(**TEST_DATA_ARCHIVE_CONFIG),
            ),
            self.assertRaises(HTTPError),
        ):
            destruction_list.create_report_zaak()

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.zaak_destruction_report_url,
            "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        self.assertEqual(
            destruction_list.internal_results["created_resources"]["resultaten"],
            ["http://localhost:8003/zaken/api/v1/resultaten/111-111-111"],
        )
        self.assertEqual(
            destruction_list.internal_results["created_resources"]["statussen"],
            ["http://localhost:8003/zaken/api/v1/statussen/111-111-111"],
        )

    @Mocker()
    def test_failure_zio_creation(self, m):
        destruction_list = DestructionListFactory.create(with_report=True)
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )
        ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
        )

        m.post(
            "http://localhost:8003/zaken/api/v1/zaken",
            json={"url": "http://localhost:8003/zaken/api/v1/zaken/111-111-111"},
        )
        m.post(
            "http://localhost:8003/zaken/api/v1/resultaten",
            json={"url": "http://localhost:8003/zaken/api/v1/resultaten/111-111-111"},
        )
        m.post(
            "http://localhost:8003/zaken/api/v1/statussen",
            json={"url": "http://localhost:8003/zaken/api/v1/statussen/111-111-111"},
        )
        m.post(
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten",
            json={
                "url": "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111"
            },
        )
        m.post(
            "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten", status_code=500
        )

        with (
            patch(
                "openarchiefbeheer.destruction.utils.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(**TEST_DATA_ARCHIVE_CONFIG),
            ),
            self.assertRaises(HTTPError),
        ):
            destruction_list.create_report_zaak()

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.zaak_destruction_report_url,
            "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        self.assertEqual(
            destruction_list.internal_results["created_resources"]["resultaten"],
            ["http://localhost:8003/zaken/api/v1/resultaten/111-111-111"],
        )
        self.assertEqual(
            destruction_list.internal_results["created_resources"]["statussen"],
            ["http://localhost:8003/zaken/api/v1/statussen/111-111-111"],
        )
        self.assertEqual(
            destruction_list.internal_results["created_resources"][
                "enkelvoudiginformatieobjecten"
            ],
            [
                "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111"
            ],
        )

    @Mocker()
    def test_resume_after_failure(self, m):
        destruction_list = DestructionListFactory.create(
            zaak_destruction_report_url="http://localhost:8003/zaken/api/v1/zaken/111-111-111"
        )
        result_store = ResultStore(destruction_list)
        internal_results = result_store.get_internal_results()
        # Fake intermediate results that are created during failures
        internal_results["created_resources"].update(
            {
                "resultaten": [
                    "http://localhost:8003/zaken/api/v1/resultaten/111-111-111"
                ],
                "statussen": [
                    "http://localhost:8003/zaken/api/v1/statussen/111-111-111"
                ],
                "enkelvoudiginformatieobjecten": [
                    "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111"
                ],
            }
        )
        result_store.save()
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )

        m.post(
            "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten",
            json={
                "url": "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten/111-111-111"
            },
        )

        # Calling create_report_zaak resumes from where there is no stored intermediate result (i.e. creating the ZIO)
        with patch(
            "openarchiefbeheer.destruction.utils.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(**TEST_DATA_ARCHIVE_CONFIG),
        ):
            destruction_list.create_report_zaak()

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.internal_results["created_resources"][
                "zaakinformatieobjecten"
            ],
            ["http://localhost:8003/zaken/api/v1/zaakinformatieobjecten/111-111-111"],
        )

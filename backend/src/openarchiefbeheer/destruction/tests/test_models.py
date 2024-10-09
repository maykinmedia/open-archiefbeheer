from datetime import date, datetime
from unittest.mock import patch

from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase
from django.utils import timezone

from freezegun import freeze_time
from privates.test import temp_private_root

from openarchiefbeheer.config.models import ArchiveConfig
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

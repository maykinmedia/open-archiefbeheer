from datetime import datetime
from unittest.mock import patch

from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase
from django.utils import timezone

from freezegun import freeze_time

from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import InternalStatus, ListItemStatus
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
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )

        item.process_deletion()

        item.refresh_from_db()

        self.assertEqual(item.processing_status, InternalStatus.failed)

    def test_process_deletion(self):
        zaak = ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/111-111-111",
            omschrijving="Test description",
        )

        item = DestructionListItemFactory.create(
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )

        with patch(
            "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects"
        ) as m_delete_in_openzaak:
            item.process_deletion()

        m_delete_in_openzaak.assert_called_once()
        kwargs = m_delete_in_openzaak.call_args_list[0].kwargs
        self.assertEqual(kwargs["zaak"].url, zaak.url)
        self.assertEqual(kwargs["result_store"].store.pk, item.pk)

        item.refresh_from_db()

        self.assertEqual(item.processing_status, InternalStatus.succeeded)

        with self.assertRaises(ObjectDoesNotExist):
            Zaak.objects.get(url=zaak.url)


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


class DestructionListTest(TestCase):
    def test_has_long_review_process(self):
        destruction_list = DestructionListFactory.create()
        zaken_short = ZaakFactory.create_batch(
            2, zaaktype="http://catalogi-api.nl/zaaktype/1"
        )
        zaak_long = ZaakFactory.create(zaaktype="http://catalogi-api.nl/zaaktype/2")
        DestructionListItemFactory.create(
            destruction_list=destruction_list, zaak_url=zaken_short[0].url
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list, zaak_url=zaken_short[1].url
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list, zaak_url=zaak_long.url
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
        zaken_short = ZaakFactory.create_batch(
            2, zaaktype="http://catalogi-api.nl/zaaktype/1"
        )
        zaak_short = ZaakFactory.create(zaaktype="http://catalogi-api.nl/zaaktype/2")
        DestructionListItemFactory.create(
            destruction_list=destruction_list, zaak_url=zaken_short[0].url
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list, zaak_url=zaken_short[1].url
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list, zaak_url=zaak_short.url
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

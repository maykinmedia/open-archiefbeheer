import logging
from datetime import datetime

from django.test import TestCase
from django.utils import timezone

from freezegun import freeze_time
from testfixtures import log_capture

from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from .factories import DestructionListFactory, DestructionListItemFactory


class DestructionListItemTest(TestCase):
    def test_get_zaak_data(self):
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/111-111-111",
            omschrijving="Test description",
        )

        item = DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
        )

        zaak_data = item.get_zaak_data()

        self.assertEqual(zaak_data["omschrijving"], "Test description")

    def test_get_zaak_data_removed_case(self):
        item = DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/111-111-111",
            status=ListItemStatus.removed,
        )

        zaak_data = item.get_zaak_data()

        self.assertIsNone(zaak_data)

    @log_capture(level=logging.ERROR)
    def test_get_zaak_data_missing_case(self, logs):
        item = DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
        )
        zaak_data = item.get_zaak_data()

        self.assertEqual(
            (
                "openarchiefbeheer.destruction.models",
                "ERROR",
                "Zaak with url http://zaken.nl/api/v1/zaken/111-111-111 and status "
                '"suggested" could not be found in the cache.',
            ),
            logs[0],
        )
        self.assertIsNone(zaak_data)

    def test_set_status(self):
        destruction_list = DestructionListFactory.create()

        with freeze_time("2024-05-02T16:00:00+02:00"):
            destruction_list.set_status(ListItemStatus.removed)

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.status_changed,
            timezone.make_aware(datetime(2024, 5, 2, 16, 0)),
        )

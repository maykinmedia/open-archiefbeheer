import logging

from django.test import TestCase

from testfixtures import log_capture

from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from .factories import DestructionListItemFactory


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

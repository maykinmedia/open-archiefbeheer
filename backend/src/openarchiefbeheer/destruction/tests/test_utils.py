from django.test import TransactionTestCase

from ..utils import process_zaken
from .factories import DestructionListItemFactory


class UtilsTestCase(TransactionTestCase):
    def test_filtering_zaken(self):
        DestructionListItemFactory.create(
            zaak="http://zaken-api.nl/zaken/api/v1/zaken/111-111-111"
        )
        DestructionListItemFactory.create(
            zaak="http://zaken-api.nl/zaken/api/v1/zaken/222-222-222"
        )

        zaken = [
            {"url": "http://zaken-api.nl/zaken/api/v1/zaken/111-111-111"},
            {"url": "http://zaken-api.nl/zaken/api/v1/zaken/333-333-333"},
        ]

        filtered_zaken = process_zaken(zaken)

        self.assertEqual(
            filtered_zaken,
            [{"url": "http://zaken-api.nl/zaken/api/v1/zaken/333-333-333"}],
        )

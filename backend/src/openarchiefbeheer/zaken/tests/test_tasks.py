from django.test import TestCase

from requests_mock import Mocker
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ..models import Zaak
from ..tasks import retrieve_and_cache_zaken_from_openzaak

PAGE_1 = {
    "results": [
        {
            "identificatie": "ZAAK-01",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/111-111-111",
        },
        {
            "identificatie": "ZAAK-02",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/222-222-222",
        },
    ],
    "count": 2,
    "previous": None,
    "next": "http://zaken-api.nl/zaken/api/v1/zaken/?page=2",
}

PAGE_2 = {
    "results": [
        {
            "identificatie": "ZAAK-03",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/333-333-333",
        },
        {
            "identificatie": "ZAAK-04",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/444-444-444",
        },
    ],
    "count": 2,
    "previous": None,
    "next": None,
}


@Mocker()
class TasksTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/zaken/api/v1",
        )

    def test_retrieve_and_cache_zaken(self, m):
        Zaak.objects.create(data={"uuid": "111-111-111"})

        m.get("http://zaken-api.nl/zaken/api/v1/zaken", json=PAGE_1)
        m.get("http://zaken-api.nl/zaken/api/v1/zaken/?page=2", json=PAGE_2)

        retrieve_and_cache_zaken_from_openzaak()

        self.assertFalse(Zaak.objects.filter(data__uuid="111-111-111").exists())

        zaken = Zaak.objects.all()

        self.assertEqual(zaken.count(), 4)

from django.test import TestCase

from requests_mock import Mocker
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ..models import Zaak
from ..tasks import retrieve_and_cache_zaken_from_openzaak
from .factories import ZaakFactory

PAGE_1 = {
    "results": [
        {
            "identificatie": "ZAAK-01",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/75f4c682-1e16-45ea-8f78-99b4474986ac",
            "uuid": "75f4c682-1e16-45ea-8f78-99b4474986ac",
            "startdatum": "2020-02-01",
            "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
            "bronorganisatie": "000000000",
            "verantwoordelijkeOrganisatie": "000000000",
        },
        {
            "identificatie": "ZAAK-02",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/79dbdbb6-b903-4655-84de-d0b9e106b781",
            "uuid": "79dbdbb6-b903-4655-84de-d0b9e106b781",
            "startdatum": "2020-02-01",
            "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
            "bronorganisatie": "000000000",
            "verantwoordelijkeOrganisatie": "000000000",
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
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/5d825de3-9264-4ba9-bb79-fbfccf9215eb",
            "uuid": "5d825de3-9264-4ba9-bb79-fbfccf9215eb",
            "startdatum": "2020-02-01",
            "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
            "bronorganisatie": "000000000",
            "verantwoordelijkeOrganisatie": "000000000",
        },
        {
            "identificatie": "ZAAK-04",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/60e0b861-fee0-453c-8f5d-6816e657b93b",
            "uuid": "60e0b861-fee0-453c-8f5d-6816e657b93b",
            "startdatum": "2020-02-01",
            "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
            "bronorganisatie": "000000000",
            "verantwoordelijkeOrganisatie": "000000000",
        },
    ],
    "count": 2,
    "previous": "http://zaken-api.nl/zaken/api/v1/zaken/?page=1",
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
        zaak = ZaakFactory.create()
        zaak_uuid = zaak.uuid

        m.get("http://zaken-api.nl/zaken/api/v1/zaken", json=PAGE_1)
        m.get("http://zaken-api.nl/zaken/api/v1/zaken/?page=2", json=PAGE_2)

        retrieve_and_cache_zaken_from_openzaak()

        self.assertFalse(Zaak.objects.filter(uuid=zaak_uuid).exists())

        zaken = Zaak.objects.all()

        self.assertEqual(zaken.count(), 4)

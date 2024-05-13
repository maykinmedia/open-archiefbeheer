from django.test import TestCase, TransactionTestCase

from requests_mock import Mocker
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ..models import Zaak
from ..tasks import retrieve_and_cache_zaken_from_openzaak
from ..utils import get_procestype
from .factories import ZaakFactory

PAGE_1 = {
    "results": [
        {
            "identificatie": "ZAAK-01",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/75f4c682-1e16-45ea-8f78-99b4474986ac",
            "uuid": "75f4c682-1e16-45ea-8f78-99b4474986ac",
            "resultaat": "http://zaken-api.nl/zaken/api/v1/resultaten/ffaa6410-0319-4a6b-b65a-fb209798e81c",
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
class RetrieveCachedZakenTest(TestCase):
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


PAGE_WITH_EXPAND = {
    "results": [
        {
            "identificatie": "ZAAK-01",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/75f4c682-1e16-45ea-8f78-99b4474986ac",
            "uuid": "75f4c682-1e16-45ea-8f78-99b4474986ac",
            "resultaat": "http://zaken-api.nl/zaken/api/v1/resultaten/ffaa6410-0319-4a6b-b65a-fb209798e81c",
            "startdatum": "2020-02-01",
            "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
            "bronorganisatie": "000000000",
            "verantwoordelijkeOrganisatie": "000000000",
            "_expand": {
                "zaaktype": {
                    "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                    "selectielijstProcestype": "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
                },
                "resultaat": {
                    "url": "http://zaken-api.nl/zaken/api/v1/resultaten/ffaa6410-0319-4a6b-b65a-fb209798e81c",
                    "resultaattype": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/bd84c463-fa65-46ef-8a9e-dd887e005aea",
                    "toelichting": "Test result",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/bd84c463-fa65-46ef-8a9e-dd887e005aea",
                        },
                    },
                },
            },
        },
        {
            "identificatie": "ZAAK-02",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/79dbdbb6-b903-4655-84de-d0b9e106b781",
            "uuid": "79dbdbb6-b903-4655-84de-d0b9e106b781",
            "startdatum": "2020-02-01",
            "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
            "bronorganisatie": "000000000",
            "verantwoordelijkeOrganisatie": "000000000",
            "resultaat": "http://zaken-api.nl/zaken/api/v1/resultaten/ffaa6410-0319-4a6b-b65a-fb209798e81c",
            "_expand": {
                "zaaktype": {
                    "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                },
            },
        },
        {
            "identificatie": "ZAAK-03",
            "url": "http://zaken-api.nl/zaken/api/v1/zaken/89dbdbb6-b903-4655-84de-d0b9e106b781",
            "uuid": "89dbdbb6-b903-4655-84de-d0b9e106b781",
            "startdatum": "2020-02-01",
            "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
            "bronorganisatie": "000000000",
            "verantwoordelijkeOrganisatie": "000000000",
        },
    ],
    "count": 3,
    "previous": None,
    "next": None,
}


@Mocker()
class RetrieveCachedZakenWithProcestypeTest(TransactionTestCase):
    def setUp(self):
        super().setUp()

        self.addCleanup(get_procestype.cache_clear)

    def test_expanded_correctly(self, m):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/zaken/api/v1",
        )
        ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1/",
        )

        m.get("http://zaken-api.nl/zaken/api/v1/zaken", json=PAGE_WITH_EXPAND)
        m.get(
            "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
            json={
                "url": "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
                "nummer": 1,
            },
        )

        retrieve_and_cache_zaken_from_openzaak()

        zaak_with_resultaat = Zaak.objects.get(identificatie="ZAAK-01")

        self.assertEqual(zaak_with_resultaat.resultaat["toelichting"], "Test result")
        self.assertEqual(
            zaak_with_resultaat.resultaat["resultaattype"],
            {
                "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/bd84c463-fa65-46ef-8a9e-dd887e005aea",
            },
        )
        self.assertEqual(
            zaak_with_resultaat.zaaktype["url"],
            "http://catalogue-api.nl/zaaktypen/111-111-111",
        )
        self.assertEqual(
            zaak_with_resultaat.zaaktype["selectielijst_procestype"]["nummer"],
            1,
        )

        zaak_without_expanded_resultaat = Zaak.objects.get(identificatie="ZAAK-02")

        self.assertEqual(
            zaak_without_expanded_resultaat.resultaat,
            "http://zaken-api.nl/zaken/api/v1/resultaten/ffaa6410-0319-4a6b-b65a-fb209798e81c",
        )

        zaak_without_expand = Zaak.objects.get(identificatie="ZAAK-03")

        self.assertEqual(
            zaak_without_expand.zaaktype,
            "http://catalogue-api.nl/zaaktypen/111-111-111",
        )

    def test_expand_no_selectielijst_service(self, m):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/zaken/api/v1",
        )

        m.get(
            "http://zaken-api.nl/zaken/api/v1/zaken",
            json={
                "results": [
                    {
                        "identificatie": "ZAAK-01",
                        "url": "http://zaken-api.nl/zaken/api/v1/zaken/75f4c682-1e16-45ea-8f78-99b4474986ac",
                        "uuid": "75f4c682-1e16-45ea-8f78-99b4474986ac",
                        "resultaat": "http://zaken-api.nl/zaken/api/v1/resultaten/ffaa6410-0319-4a6b-b65a-fb209798e81c",
                        "startdatum": "2020-02-01",
                        "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
                        "bronorganisatie": "000000000",
                        "verantwoordelijkeOrganisatie": "000000000",
                        "_expand": {
                            "zaaktype": {
                                "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                                "selectielijstProcestype": "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
                            },
                        },
                    }
                ]
            },
        )

        retrieve_and_cache_zaken_from_openzaak()

        zaak = Zaak.objects.get(identificatie="ZAAK-01")

        self.assertEqual(
            zaak.zaaktype["selectielijst_procestype"],
            "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
        )

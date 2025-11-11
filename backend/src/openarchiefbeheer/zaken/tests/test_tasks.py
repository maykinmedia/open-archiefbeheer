from datetime import date

from django.test import TestCase, TransactionTestCase, tag
from django.utils.translation import gettext_lazy as _

import requests
from freezegun import freeze_time
from requests_mock import Mocker
from timeline_logger.models import TimelineLog
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.tests.factories import APIConfigFactory
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.utils.tests.get_queries import executed_queries
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin

from ..models import Zaak
from ..tasks import resync_zaken, retrieve_and_cache_zaken_from_openzaak
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
class RetrieveAndCacheZakenTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/zaken/api/v1",
        )
        APIConfigFactory.create()

    def test_no_zaken_in_db(self, m):
        Zaak.objects.all().delete()

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
                "next": None,
            },
        )

        with freeze_time("2024-08-29T16:00:00+02:00"):
            retrieve_and_cache_zaken_from_openzaak()

        zaak_request = m.request_history[0]
        self.assertIn("einddatum__lt", zaak_request.qs)
        self.assertEqual(zaak_request.qs["einddatum__lt"][0], "2024-08-29")
        self.assertNotIn("einddatum__gt", zaak_request.qs)

    def test_zaken_in_database(self, m):
        # The latest eindatum is taken
        ZaakFactory.create(einddatum=date(2024, 8, 27))
        ZaakFactory.create(einddatum=date(2024, 8, 26))
        ZaakFactory.create(einddatum=date(2024, 8, 25))

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
                "next": None,
            },
        )

        with freeze_time("2024-08-29T16:00:00+02:00"):
            retrieve_and_cache_zaken_from_openzaak()

        zaak_request = m.request_history[0]
        self.assertIn("einddatum__lt", zaak_request.qs)
        self.assertEqual(zaak_request.qs["einddatum__lt"][0], "2024-08-29")
        self.assertIn("einddatum__gt", zaak_request.qs)
        self.assertEqual(zaak_request.qs["einddatum__gt"][0], "2024-08-27")

    def test_zaak_already_in_db_is_retrieved_again(self, m):
        zaak = ZaakFactory.create(
            url="http://zaken-api.nl/zaken/api/v1/zaken/111-111-111",
            resultaat="http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111",
        )

        m.get(
            "http://zaken-api.nl/zaken/api/v1/zaken",
            json={
                "results": [
                    {
                        "identificatie": "ZAAK-01",
                        "url": "http://zaken-api.nl/zaken/api/v1/zaken/111-111-111",
                        "uuid": "75f4c682-1e16-45ea-8f78-99b4474986ac",
                        "resultaat": "http://zaken-api.nl/zaken/api/v1/resultaten/222-222-222",
                        "startdatum": "2020-02-01",
                        "einddatum": "2024-08-29",
                        "zaaktype": "http://catalogue-api.nl/zaaktypen/111-111-111",
                        "bronorganisatie": "000000000",
                        "verantwoordelijkeOrganisatie": "000000000",
                    },
                ],
                "count": 1,
                "previous": None,
                "next": None,
            },
        )

        with freeze_time("2024-08-29T16:00:00+02:00"):
            retrieve_and_cache_zaken_from_openzaak()

        self.assertEqual(Zaak.objects.count(), 1)

        zaak.refresh_from_db()

        # We dont resync, since the zaken with einddatum should not change
        self.assertEqual(
            zaak.resultaat, "http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111"
        )

    def test_retrieve_and_cache_zaken(self, m):
        ZaakFactory.create(url="http://zaken-api.nl/zaken/api/v1/zaken/111-111-111")

        m.get("http://zaken-api.nl/zaken/api/v1/zaken", json=PAGE_1)
        m.get("http://zaken-api.nl/zaken/api/v1/zaken/?page=2", json=PAGE_2)

        retrieve_and_cache_zaken_from_openzaak()

        self.assertTrue(
            Zaak.objects.filter(
                url="http://zaken-api.nl/zaken/api/v1/zaken/111-111-111"
            ).exists()
        )

        zaken = Zaak.objects.all()

        self.assertEqual(zaken.count(), 5)

    @tag("gh-34")
    def test_retrieve_zaken_with_archiefnominatie_null(self, m):
        m.get(
            "http://zaken-api.nl/zaken/api/v1/zaken",
            json={
                "next": None,
                "previous": None,
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
                        "archiefnominatie": None,
                    }
                ],
            },
        )

        retrieve_and_cache_zaken_from_openzaak()

        self.assertEqual(Zaak.objects.all().count(), 1)

    @tag("gh-41")
    def test_retrieve_zaken_with_geometry(self, m):
        m.get(
            "http://zaken-api.nl/zaken/api/v1/zaken",
            json={
                "next": None,
                "previous": None,
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
                        "zaakgeometrie": {
                            "type": "Point",
                            "coordinates": [39.81005493339004, 88.23584101738716],
                        },
                    }
                ],
            },
        )

        retrieve_and_cache_zaken_from_openzaak()

        self.assertEqual(Zaak.objects.all().count(), 1)


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
    # Needed because the test teardown calls the management command "flush", which
    # removes the permissions created with the data migration from the db.
    fixtures = ["permissions.json"]

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

    def test_expanded_correctly(self, m):
        APIConfigFactory.create()
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/zaken/api/v1",
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

        self.assertEqual(
            zaak_with_resultaat._expand["resultaat"]["toelichting"], "Test result"
        )
        self.assertEqual(
            zaak_with_resultaat._expand["resultaat"]["_expand"]["resultaattype"],
            {
                "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/bd84c463-fa65-46ef-8a9e-dd887e005aea",
            },
        )
        self.assertEqual(
            zaak_with_resultaat._expand["zaaktype"]["url"],
            "http://catalogue-api.nl/zaaktypen/111-111-111",
        )
        self.assertEqual(
            zaak_with_resultaat._expand["zaaktype"]["selectielijst_procestype"][
                "nummer"
            ],
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
        APIConfigFactory.create(selectielijst_api_service=None)
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
            zaak._expand["zaaktype"]["selectielijst_procestype"],
            "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
        )

    @tag("gh-296")
    def test_resyncing_zaken_does_not_break_destruction_list(self, m):
        APIConfigFactory.create()
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken-api.nl/zaken/api/v1/zaken/75f4c682-1e16-45ea-8f78-99b4474986ac",
        )

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
        m.get(
            "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
            json={
                "url": "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
                "nummer": 1,
                "jaar": 2017,
                "naam": "Instellen en inrichten organisatie",
                "omschrijving": "Instellen en inrichten organisatie",
                "toelichting": "Dit procestype betreft het instellen van een nieuw organisatieonderdeel of een nieuwe orgaan waar het orgaan in deelneemt. Dit procestype betreft eveneens het inrichten van het eigen orgaan. Dit kan kleinschalig plaatsvinden bijvoorbeeld het wijzigen van de uitvoering van een wettelijke taak of grootschalig wanneer er een organisatiewijziging wordt doorgevoerd.",
                "procesobject": "De vastgestelde organisatie inrichting",
            },
        )

        resync_zaken()

        item.refresh_from_db()

        self.assertIsNotNone(item.zaak)
        self.assertEqual(
            item.zaak.url,
            "http://zaken-api.nl/zaken/api/v1/zaken/75f4c682-1e16-45ea-8f78-99b4474986ac",
        )

        logs = TimelineLog.objects.all().order_by("pk")

        self.assertEqual(logs.count(), 2)
        self.assertEqual(
            logs[0].get_message(), _("Resyncing of the cases has started.")
        )
        self.assertEqual(
            logs[1].get_message(),
            _("Resyncing of the cases has completed successfully."),
        )

    def test_resync_zaken_raises_error(self, m):
        APIConfigFactory.create()
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/zaken/api/v1",
        )

        m.get(
            "http://zaken-api.nl/zaken/api/v1/zaken",
            exc=requests.exceptions.ConnectTimeout("Oh noes!"),
        )

        with self.assertRaises(requests.exceptions.ConnectTimeout):
            resync_zaken()

        logs = TimelineLog.objects.all()

        self.assertEqual(logs.count(), 2)
        self.assertEqual(
            logs[0].get_message(), _("Resyncing of the cases has started.")
        )
        self.assertEqual(
            logs[1].get_message(),
            _("Resyncing of the cases has failed with the following error: %(error)s")
            % {"error": "requests.exceptions.ConnectTimeout: Oh noes!\n"},
        )


class RetrieveCachedZakenQueryTest(ClearCacheMixin, TestCase):
    @Mocker()
    def test_queries_retrieve_zaken(self, m):
        ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1/",
        )
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/zaken/api/v1",
        )

        m.get("http://zaken-api.nl/zaken/api/v1/zaken", json=PAGE_WITH_EXPAND)
        m.get(
            "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
            json={
                "url": "https://selectielijst.openzaak.nl/api/v1/procestypen/e1b73b12-b2f6-4c4e-8929-94f84dd2a57d",
                "nummer": 1,
            },
        )

        with executed_queries() as q:
            resync_zaken()

        queries = q.captured_queries

        self.assertEqual(
            1, len([q for q in queries if 'SELECT "zgw_consumers_service"' in q["sql"]])
        )
        self.assertEqual(
            1, len([q for q in queries if 'SELECT "config_apiconfig"' in q["sql"]])
        )
        self.assertEqual(
            1, len([q for q in queries if 'INSERT INTO "zaken_zaak"' in q["sql"]])
        )

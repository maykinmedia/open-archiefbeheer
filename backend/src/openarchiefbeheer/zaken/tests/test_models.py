import logging  # noqa: TID251 - only used for the log levels

from django.test import TestCase

import requests_mock
from requests.exceptions import HTTPError
from testfixtures import log_capture
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from .factories import ZaakFactory


class ZaakReplaceResultaatTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/",
        )

    @log_capture(level=logging.INFO)
    def test_replace_resultaat_skips_when_resultaattype_is_unchanged(self, logs):
        zaak = ZaakFactory.create(
            resultaat="http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111"
        )

        zaak.replace_resultaat(
            "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111"
        )

        self.assertTrue("replace_resultaat_skip" in logs[0][2])

    def test_replace_resultaat_deletes_existing_resultaat_and_creates_new_one(self):
        old_resultaat = "http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111"
        new_resultaat = "http://zaken-api.nl/zaken/api/v1/resultaten/222-222-222"
        new_resultaattype = (
            "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/222-222-222"
        )

        zaak = ZaakFactory.create(resultaat=old_resultaat)

        with requests_mock.Mocker() as mocker:
            mocker.delete(old_resultaat, status_code=204)
            post = mocker.post(
                "http://zaken-api.nl/resultaten",
                json={"url": new_resultaat},
                status_code=201,
            )

            zaak.replace_resultaat(new_resultaattype)

        self.assertEqual(mocker.call_count, 2)

        self.assertEqual(
            post.last_request.json(),
            {
                "zaak": zaak.url,
                "resultaattype": new_resultaattype,
            },
        )

        zaak.refresh_from_db()
        self.assertEqual(zaak.resultaat, new_resultaat)

    def test_replace_resultaat_does_not_create_when_delete_fails(self):
        old_resultaat = "http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111"
        new_resultaattype = (
            "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/222-222-222"
        )

        zaak = ZaakFactory.create(resultaat=old_resultaat)

        with requests_mock.Mocker() as mocker:
            mocker.delete(old_resultaat, status_code=500)
            post = mocker.post("http://zaken-api.nl/zaken/resultaten")

            with self.assertRaises(HTTPError):
                zaak.replace_resultaat(new_resultaattype)

        self.assertFalse(post.called)

        zaak.refresh_from_db()
        self.assertEqual(zaak.resultaat, old_resultaat)

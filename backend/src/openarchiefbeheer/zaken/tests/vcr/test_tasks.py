from unittest.mock import patch

from django.test import TestCase, override_settings, tag

import requests
from freezegun import freeze_time
from requests_mock import Mocker
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.models import APIConfig
from openarchiefbeheer.utils.utils_decorators import reload_openzaak_fixtures
from openarchiefbeheer.zaken.models import Zaak

from ...tasks import resync_zaken, retrieve_and_cache_zaken_from_openzaak


@tag("vcr")
class RecachingZakenTests(VCRMixin, TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.selectielijst_service = ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/zaken/api/v1",
        )

    @tag("gh-298")
    @reload_openzaak_fixtures()
    def test_recaching_zaken_with_multiple_pages_doesnt_explode_url(self):
        with Mocker(real_http=True) as m:
            with freeze_time("2024-08-29T16:00:00+02:00"):
                retrieve_and_cache_zaken_from_openzaak()

            last_call = m.request_history[-1]

            self.assertEqual(
                last_call.query,
                "archiefnominatie=vernietigen&einddatum__isnull=false&einddatum__lt=2024-08-29&expand=resultaat%2cresultaat.resultaattype%2czaaktype%2crollen&page=2",
            )

        zaken_in_db = Zaak.objects.all()

        self.assertEqual(zaken_in_db.count(), 103)

    @reload_openzaak_fixtures()
    def test_recaching_zaken_correct_eindatum(self):
        with freeze_time("2024-08-02T16:00:00+02:00"):
            retrieve_and_cache_zaken_from_openzaak()

        zaken_in_db = Zaak.objects.all()

        self.assertEqual(zaken_in_db.count(), 2)

        with freeze_time("2024-08-29T16:00:00+02:00"):
            retrieve_and_cache_zaken_from_openzaak()

        zaken_in_db = Zaak.objects.all()

        self.assertEqual(zaken_in_db.count(), 103)

    @override_settings(
        RETRY_TOTAL=2, RETRY_BACKOFF_FACTOR=1, RETRY_STATUS_FORCELIST=[504]
    )
    def test_resync_zaken_retry_mechanism(self):
        with (
            self.assertRaises(requests.exceptions.RetryError),
            patch(
                "openarchiefbeheer.zaken.utils.APIConfig.get_solo",
                return_value=APIConfig(
                    selectielijst_api_service=self.selectielijst_service
                ),
            ),
        ):
            resync_zaken()

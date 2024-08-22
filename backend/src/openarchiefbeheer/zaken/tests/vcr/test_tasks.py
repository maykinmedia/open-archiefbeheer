from django.test import TestCase, tag

from requests_mock import Mocker
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ...tasks import retrieve_and_cache_zaken_from_openzaak


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

    @tag("gh-298")
    def test_recaching_zaken_with_multiple_pages_doesnt_explode_url(self):
        with Mocker(real_http=True) as m:
            retrieve_and_cache_zaken_from_openzaak()

            last_call = m.request_history[-1]

            self.assertEqual(
                last_call.query,
                "archiefnominatie=vernietigen&expand=resultaat%2cresultaat.resultaattype%2czaaktype%2crollen&page=2",
            )

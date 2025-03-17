from django.core.cache import cache
from django.test import TestCase, tag

from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.models import APIConfig

from ..api.serializers import ZaakMetadataSerializer
from .factories import ZaakFactory


@tag("vcr")
class ZaakSerialisersTests(VCRMixin, TestCase):
    def setUp(self):
        super().setUp()

        cache.clear()

        self.addCleanup(cache.clear)

    def test_selectielijstklasse(self):
        service = ServiceFactory(
            slug="selectielijst",
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1/",
        )
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        config = APIConfig.get_solo()
        config.selectielijst_api_service = service
        config.save()

        zaak = ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/fe192229-0998-49cd-95e5-ec5de32e512a",
            uuid="fe192229-0998-49cd-95e5-ec5de32e512a",
            selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/cc5ae4e3-a9e6-4386-bcee-46be4986a829",
        )

        serialiser = ZaakMetadataSerializer(instance=zaak)

        self.assertEqual(
            serialiser.data["selectielijstklasse"],
            "1.1 - Ingericht - vernietigen - P10Y (2017)",
        )

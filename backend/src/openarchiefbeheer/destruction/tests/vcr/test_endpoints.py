from django.test import tag

from rest_framework.test import APITestCase
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory


@tag("vcr")
class DestructionListEndpointTest(VCRMixin, APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.drc_service = ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

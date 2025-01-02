from django.test import tag
from django.utils.translation import gettext_lazy as _

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import ListStatus
from ..factories import DestructionListFactory


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

    def test_retrieve_destruction_report_from_internal_results(self):
        user = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
            internal_results={
                "created_resources": {
                    "enkelvoudiginformatieobjecten": [
                        "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/ac7ab173-3b1c-4ea9-8ccb-023c3814e3b3"
                    ]
                }
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_report_from_zaak_url(self):
        user = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
            zaak_destruction_report_url="http://localhost:8003/zaken/api/v1/zaken/b316d968-c357-4fbf-a1ad-60b3f8b9c3a6",
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_report_not_found_in_openzaak(self):
        user = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
            internal_results={
                "created_resources": {
                    "enkelvoudiginformatieobjecten": [
                        "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111"  # Doesn't exist in OZ
                    ]
                }
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unexpected_error_response_from_openzaak_when_retrieving_report(self):
        """
        Cassette recorded with the binary file in the private media of OZ
        corresponding to the destruction report deleted. This causes OZ to
        return a 500 error.
        """
        user = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
            internal_results={
                "created_resources": {
                    "enkelvoudiginformatieobjecten": [
                        "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/ac7ab173-3b1c-4ea9-8ccb-023c3814e3b3"
                    ]
                }
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(
            response.json()["detail"], _("Error response received from Open Zaak.")
        )

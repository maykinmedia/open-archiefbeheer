from furl import furl
from requests_mock import Mocker
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory

RESPONSE_LIST = {
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
    "next": None,
}


@Mocker()
class ZakenEndpointsTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="vcr-local-test",
            secret="vcr-local-test",
        )

    def test_not_authenticated(self, m):
        api_url = reverse("api:zaken:zaken")

        response = self.client.get(api_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_successful_response(self, m):
        user = UserFactory.create(username="test", password="password")
        api_url = reverse("api:zaken:zaken")

        m.get("http://localhost:8003/zaken/api/v1/zaken", json=RESPONSE_LIST)

        self.client.force_authenticate(user=user)
        response = self.client.get(api_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data, RESPONSE_LIST)

    def test_with_filters(self, m):
        user = UserFactory.create(username="test", password="password")
        api_url = furl(reverse("api:zaken:zaken"))
        api_url.args["bronorganisatie"] = "000000"
        api_url.args["archiefstatus"] = "nog_te_archiveren"

        m.get("http://localhost:8003/zaken/api/v1/zaken", json=RESPONSE_LIST)

        self.client.force_authenticate(user=user)
        response = self.client.get(api_url.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        query_params = m.request_history[0].qs

        self.assertIn("bronorganisatie", query_params)
        self.assertIn("archiefstatus", query_params)

    def test_error_response(self, m):
        user = UserFactory.create(username="test", password="password")
        api_url = reverse("api:zaken:zaken")

        m.get(
            "http://localhost:8003/zaken/api/v1/zaken",
            json={"invalid": "Something went wrong"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(api_url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()

        self.assertEqual(data, {"error": {"invalid": "Something went wrong"}})

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase


class SchemaEndpointTests(APITestCase):

    def test_retrieve_json_schema(self):
        response = self.client.get(reverse("api:schema"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

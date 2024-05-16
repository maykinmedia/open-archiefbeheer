from unittest.mock import patch

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..tasks import retrieve_and_cache_zaken_from_openzaak


class ZakenViewsTestCase(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-zaken")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(is_staff=False)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaken")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cache_zaken(self):
        user = UserFactory.create(is_staff=True)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaken")

        with patch.object(
            retrieve_and_cache_zaken_from_openzaak,
            "delay",
        ) as m:
            response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        m.assert_called_once()

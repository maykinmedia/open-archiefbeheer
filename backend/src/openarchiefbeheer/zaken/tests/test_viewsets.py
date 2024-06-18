from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from .factories import ZaakFactory


class ZakenViewSetTest(APITestCase):

    def test_not_authenticated(self):
        endpoint = reverse("api:zaken-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(role__can_start_destruction=False)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:zaken-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_all_zaken_as_record_manager(self):
        ZaakFactory.create_batch(4)

        user = UserFactory(username="record_manager", role__can_start_destruction=True)

        self.client.force_authenticate(user)
        response = self.client.get(reverse("api:zaken-list"))
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

    def test_retrieve_all_zaken_as_reviewer(self):
        ZaakFactory.create_batch(4)

        user = UserFactory(username="reviewer", role__can_review_destruction=True)

        self.client.force_authenticate(user)
        response = self.client.get(reverse("api:zaken-list"))
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

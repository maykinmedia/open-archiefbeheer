from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory


class UserEndpointTests(APITestCase):
    def test_sorted(self):
        UserFactory.create(first_name="Bart", last_name="Doe")
        UserFactory.create(first_name="Anna", last_name="Doe")
        UserFactory.create(first_name="Bart", last_name="Adams")

        self.client.force_authenticate(UserFactory.build())
        response = self.client.get(reverse("api:users"))
        data = response.json()

        self.assertEqual(data[0]["firstName"], "Anna")
        self.assertEqual(data[0]["lastName"], "Doe")

        self.assertEqual(data[1]["firstName"], "Bart")
        self.assertEqual(data[1]["lastName"], "Adams")

        self.assertEqual(data[2]["firstName"], "Bart")
        self.assertEqual(data[2]["lastName"], "Doe")

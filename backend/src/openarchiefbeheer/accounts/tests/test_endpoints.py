from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import RoleFactory, UserFactory


class WhoAmIViewTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:whoami")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated(self):
        role = RoleFactory.create()
        user = UserFactory.create(role=role)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:whoami")

        response = self.client.get(endpoint)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(data["pk"], user.pk)
        self.assertEqual(data["username"], user.username)
        self.assertEqual(data["firstName"], user.first_name)
        self.assertEqual(data["lastName"], user.last_name)
        self.assertEqual(data["email"], user.email)
        self.assertEqual(data["role"]["name"], role.name)
        self.assertEqual(
            data["role"]["canStartDestruction"], role.can_start_destruction
        )
        self.assertEqual(
            data["role"]["canReviewDestruction"], role.can_review_destruction
        )
        self.assertEqual(data["role"]["canViewCaseDetails"], role.can_view_case_details)

    def test_post(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:whoami")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

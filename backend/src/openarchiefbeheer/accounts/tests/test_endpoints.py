from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory


class WhoAmIViewTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:whoami")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated(self):
        user = UserFactory.create(post__can_start_destruction=True)

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
        self.assertTrue(data["role"]["canStartDestruction"])
        self.assertFalse(data["role"]["canReviewDestruction"])

    def test_post(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:whoami")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class ArchivistViewTest(APITestCase):
    def test_not_authenticated_cant_access(self):
        endpoint = reverse("api:archivists")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_archivists(self):
        UserFactory.create_batch(2, post__can_review_final_list=True)
        UserFactory.create_batch(3, post__can_review_final_list=False)

        record_manager = UserFactory.create(post__can_start_destruction=True)

        self.client.force_login(record_manager)
        response = self.client.get(reverse("api:archivists"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

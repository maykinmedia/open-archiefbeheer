from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory


class RoleEndpointTests(APITestCase):
    def test_user_not_logged_in(self):
        response = self.client.get(reverse("api:reviewers"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_reviewers(self):
        admin = UserFactory.create(is_superuser=True)
        UserFactory.create_batch(2, post__can_review_destruction=True)
        UserFactory.create_batch(2, post__can_review_destruction=False)

        self.client.force_authenticate(user=admin)
        response = self.client.get(reverse("api:reviewers"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)
        self.assertTrue(data[0]["role"]["canReviewDestruction"])
        self.assertTrue(data[1]["role"]["canReviewDestruction"])

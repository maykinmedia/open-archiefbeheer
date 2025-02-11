from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import ListStatus, ReviewDecisionChoices
from ..factories import DestructionListFactory


class ReviewViewSetTests(APITestCase):
    def test_if_user_not_assigned_cannot_create_review(self):
        reviewer1 = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            post__can_review_destruction=True,
        )
        reviewer2 = UserFactory.create(
            username="reviewer2",
            email="reviewer2@oab.nl",
            post__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(assignee=reviewer1)

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }

        endpoint = reverse("api:destruction-list-reviews-list")

        self.client.force_authenticate(user=reviewer2)
        response = self.client.post(endpoint, data=data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_if_list_in_wrong_status_cannot_be_reviewed(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            post__can_review_destruction=True,
            post__can_review_final_list=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.changes_requested
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        endpoint = reverse("api:destruction-list-reviews-list")

        self.client.force_authenticate(user=reviewer)
        response = self.client.post(endpoint, data=data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_if_user_not_a_reviewer_cannot_create_review(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            post__can_review_destruction=False,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        endpoint = reverse("api:destruction-list-reviews-list")

        self.client.force_authenticate(user=reviewer)
        response = self.client.post(endpoint, data=data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_if_user_not_an_archivist_cannot_create_review(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            post__can_review_final_list=False,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_for_archivist
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        endpoint = reverse("api:destruction-list-reviews-list")

        self.client.force_authenticate(user=reviewer)
        response = self.client.post(endpoint, data=data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

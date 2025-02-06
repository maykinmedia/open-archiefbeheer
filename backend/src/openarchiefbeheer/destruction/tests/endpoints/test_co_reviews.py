from django.urls import reverse
from django.utils.translation import gettext as _

from furl import furl
from rest_framework import status
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import ListRole, ListStatus
from openarchiefbeheer.destruction.models import DestructionListCoReview
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListAssigneeFactory,
    DestructionListCoReviewFactory,
    DestructionListFactory,
    ReviewResponseFactory,
)


class CoReviewsViewSetTest(APITestCase):
    def test_list_not_logged_in(self):
        url = reverse("api:destruction-list-co-reviews-list")

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list(self):
        user = UserFactory()
        co_review = DestructionListCoReviewFactory.create()

        self.client.force_login(user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["pk"], co_review.pk)

    def test_list_filter_destruction_list__uuid(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        DestructionListCoReviewFactory.create()
        co_review_related = DestructionListCoReviewFactory.create(
            destruction_list=destruction_list
        )
        user = UserFactory()

        self.client.force_login(user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.get(
            furl(url, args={"destruction_list__uuid": destruction_list.uuid}).url
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["pk"], co_review_related.pk)

    def test_list_after_review_response(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        # Co review response created on date 1 chronologically
        co_review_date_1 = DestructionListCoReviewFactory.create(
            destruction_list=destruction_list
        )
        co_review_date_1.created = "1988-08-02T08:30:00+01:00"
        co_review_date_1.save()

        # Review response created on date 2 chronologically
        review_response_date_2 = ReviewResponseFactory.create(
            review__destruction_list=destruction_list,
        )
        review_response_date_2.created = "1990-10-31T00:00:00+01:00"
        review_response_date_2.save()

        # Co review created on date 3 chronologically
        co_review_date_3 = DestructionListCoReviewFactory.create(
            destruction_list=destruction_list
        )
        co_review_date_3.created = "2023-09-15T21:36:00+01:00"
        co_review_date_3.save()

        # Unrelated review response created now (date 4 chronologically, should not exclude co_review_date_3)
        ReviewResponseFactory.create()

        user = UserFactory()

        self.client.force_login(user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.get(
            furl(url, args={"destruction_list__uuid": destruction_list.uuid}).url
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["pk"], co_review_date_3.pk)

    def test_list_after_review_response_multiple(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        # Co review response created on date 1 chronologically
        co_review_date_1 = DestructionListCoReviewFactory.create(
            destruction_list=destruction_list
        )
        co_review_date_1.created = "1988-08-02T08:30:00+01:00"
        co_review_date_1.save()

        # Review response created now (date 4 chronologically, should exclude co_review_date_3)
        ReviewResponseFactory.create(
            review__destruction_list=destruction_list,
        )

        # Review response created on date 2 chronologically
        review_response_date_2 = ReviewResponseFactory.create(
            review__destruction_list=destruction_list,
        )
        review_response_date_2.created = "1990-10-31T00:00:00+01:00"
        review_response_date_2.save()

        # Co review created on date 3 chronologically
        co_review_date_3 = DestructionListCoReviewFactory.create(
            destruction_list=destruction_list
        )
        co_review_date_3.created = "2023-09-15T21:36:00+01:00"
        co_review_date_3.save()

        user = UserFactory()

        self.client.force_login(user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.get(
            furl(url, args={"destruction_list__uuid": destruction_list.uuid}).url
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_create_not_logged_in(self):
        co_reviewer = DestructionListAssigneeFactory.create(role=ListRole.co_reviewer)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        destruction_list.assignees.add(co_reviewer)

        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.post(
            url,
            {
                "destruction_list": destruction_list.uuid,
                "list_feedback": "gh-497",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_not_co_reviewer(self):
        user = DestructionListAssigneeFactory.create(
            user__post__can_co_review_destruction=False
        )
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        destruction_list.assignees.add(user)

        self.client.force_login(user.user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.post(
            url,
            {
                "destruction_list": destruction_list.uuid,
                "list_feedback": "gh-497",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_not_assigned(self):
        co_reviewer = DestructionListAssigneeFactory.create(role=ListRole.co_reviewer)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        destruction_list.assignees.add(co_reviewer)
        user = UserFactory(post__can_co_review_destruction=True)

        self.client.force_login(user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.post(
            url,
            {
                "destruction_list": destruction_list.uuid,
                "list_feedback": "gh-497",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_if_list_in_wrong_status_cannot_be_reviewed(self):
        assignees = DestructionListAssigneeFactory.create_batch(
            3,
            user__post__can_co_review_destruction=True,
        )
        co_reviewer = assignees[2]
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_for_archivist
        )
        destruction_list.assignees.set(assignees)

        self.client.force_login(co_reviewer.user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.post(
            url,
            {
                "destruction_list": destruction_list.uuid,
                "list_feedback": "gh-497",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_if_user_not_a_co_reviewer_cannot_create_review(self):
        assignees = DestructionListAssigneeFactory.create_batch(
            3,
            user__post__can_co_review_destruction=False,
        )
        co_reviewer = assignees[2].user
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        destruction_list.assignees.set(assignees)

        self.client.force_login(co_reviewer)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.post(
            url,
            {
                "destruction_list": destruction_list.uuid,
                "list_feedback": "gh-497",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_no_list_feedback(self):
        co_reviewer = DestructionListAssigneeFactory.create(role=ListRole.co_reviewer)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        destruction_list.assignees.add(co_reviewer)

        self.client.force_login(co_reviewer.user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.post(
            url,
            {
                "destruction_list": destruction_list.uuid,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["list_feedback"],
            [_("Dit veld is vereist.")],
        )

    def test_create(self):
        co_reviewer = DestructionListAssigneeFactory.create(role=ListRole.co_reviewer)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        destruction_list.assignees.add(co_reviewer)

        self.client.force_login(co_reviewer.user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.post(
            url,
            {
                "destruction_list": destruction_list.uuid,
                "list_feedback": "gh-497",
            },
        )

        co_review = DestructionListCoReview.objects.first()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(co_review.author, co_reviewer.user)
        self.assertEqual(co_review.list_feedback, "gh-497")

    def test_destruction_list_does_not_exist(self):
        co_reviewer = DestructionListAssigneeFactory.create(role=ListRole.co_reviewer)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        destruction_list.assignees.add(co_reviewer)

        self.client.force_login(co_reviewer.user)
        url = reverse("api:destruction-list-co-reviews-list")
        response = self.client.post(
            url,
            {
                "destruction_list": "7cf58293-cf87-48a1-9857-7dea3dba00e0",
                "list_feedback": "Tralala",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["destructionList"],
            _("The destruction list does not exist."),
        )

from unittest.mock import patch

from django.contrib.auth.models import Group
from django.utils.translation import gettext_lazy as _

import freezegun
from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import DestructionListItemAction, ListStatus, ZaakActionType
from ...models import ReviewItemResponse, ReviewResponse
from ..factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
    ReviewItemResponseFactory,
    ReviewResponseFactory,
)


class ReviewResponsesViewSetTests(APITestCase):
    def test_no_auth(self):
        endpoint = reverse("api:review-responses-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_on_review(self):
        user = UserFactory.create()

        review = DestructionListReviewFactory.create(destruction_list__name="List 1")
        review_response = ReviewResponseFactory.create(review=review)
        ReviewItemResponseFactory.create_batch(2, review_item__review=review)
        another_response = ReviewResponseFactory.create()
        ReviewItemResponseFactory.create(review_item__review=another_response.review)

        endpoint = furl(reverse("api:review-responses-list"))
        endpoint.args["review"] = review.pk

        self.client.force_authenticate(user=user)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["pk"], review_response.pk)
        self.assertEqual(len(data[0]["itemsResponses"]), 2)

    def test_create_review_response(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager,
        )
        items_reviews = DestructionListItemReviewFactory.create_batch(
            3,
            destruction_list_item__destruction_list=review.destruction_list,
            destruction_list_item__with_zaak=True,
            destruction_list_item__zaak__selectielijstklasse="http://some-url.nl",
            review=review,
        )

        endpoint = reverse("api:review-responses-list")
        self.client.force_authenticate(user=record_manager)

        with patch(
            "openarchiefbeheer.destruction.api.serializers.retrieve_selectielijstklasse_resultaat",
            return_value={"waardering": "vernietigen"},
        ):
            response = self.client.post(
                endpoint,
                data={
                    "review": review.pk,
                    "comment": "A comment about the review.",
                    "itemsResponses": [
                        {
                            "reviewItem": items_reviews[0].pk,
                            "actionItem": DestructionListItemAction.keep,
                            "comment": "This zaak needs to stay in the list.",
                        },
                        {
                            "reviewItem": items_reviews[1].pk,
                            "actionItem": DestructionListItemAction.remove,
                            "actionZaakType": ZaakActionType.selectielijstklasse_and_bewaartermijn,
                            "actionZaak": {
                                "selectielijstklasse": "http://some-url.nl",
                                "archiefactiedatum": "2030-01-01",
                            },
                            "comment": "Changed the selectielijstklasse and removed from the list.",
                        },
                        {
                            "reviewItem": items_reviews[2].pk,
                            "actionItem": DestructionListItemAction.remove,
                            "actionZaakType": ZaakActionType.bewaartermijn,
                            "actionZaak": {
                                "archiefactiedatum": "2030-01-01",
                            },
                            "comment": "Changed the archiefactiedatum and removed from the list.",
                        },
                    ],
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReviewResponse.objects.filter(review=review).count(), 1)
        self.assertEqual(
            ReviewItemResponse.objects.filter(review_item__review=review).count(), 3
        )

        item_response1 = ReviewItemResponse.objects.get(review_item=items_reviews[0].pk)

        self.assertEqual(item_response1.action_item, DestructionListItemAction.keep)
        self.assertEqual(item_response1.comment, "This zaak needs to stay in the list.")

        item_response2 = ReviewItemResponse.objects.get(review_item=items_reviews[1].pk)

        self.assertEqual(
            item_response2.action_zaak["selectielijstklasse"], "http://some-url.nl"
        )
        self.assertEqual(item_response2.action_zaak["archiefactiedatum"], "2030-01-01")

        item_response3 = ReviewItemResponse.objects.get(review_item=items_reviews[2].pk)

        self.assertEqual(item_response3.action_zaak["archiefactiedatum"], "2030-01-01")

    def test_can_create_response_if_not_author(self):
        record_manager1 = UserFactory.create(post__can_start_destruction=True)
        record_manager2 = UserFactory.create(post__can_start_destruction=True)

        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager1,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager1,
        )

        endpoint = reverse("api:review-responses-list")
        self.client.force_authenticate(user=record_manager2)

        response = self.client.post(
            endpoint,
            data={
                "review": review.pk,
                "comment": "A comment about the review.",
                "itemsResponses": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cannot_create_response_if_not_changes_requested(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)

        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.ready_to_review,
            destruction_list__assignee=record_manager,
        )

        endpoint = reverse("api:review-responses-list")
        self.client.force_authenticate(user=record_manager)

        response = self.client.post(
            endpoint,
            data={
                "review": review.pk,
                "comment": "A comment about the review.",
                "itemsResponses": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["nonFieldErrors"][0],
            _(
                "This user is either not allowed to update the destruction list or "
                "the destruction list cannot currently be updated."
            ),
        )

    @freezegun.freeze_time("2023-09-15T21:36:00+02:00")
    def test_audit_log(self):
        # Reassign
        record_manager = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="Test audittrail",
            status=ListStatus.ready_to_review,
            author=record_manager,
        )
        record_manager_group, created = Group.objects.get_or_create(
            name="Record Manager"
        )
        record_manager.groups.add(record_manager_group)
        DestructionListAssigneeFactory.create(destruction_list=destruction_list)
        other_reviewer = UserFactory.create(post__can_review_destruction=True)

        self.client.force_authenticate(user=record_manager)
        endpoint_reassign = reverse(
            "api:destructionlist-reassign", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint_reassign,
            data={
                "assignee": {"user": other_reviewer.pk},
                "comment": "Lorem ipsum...",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        endpoint_audittrail = furl(reverse("api:logs-list"))
        endpoint_audittrail.args["destruction_list"] = destruction_list.uuid
        response_audittrail = self.client.get(endpoint_audittrail.url)

        self.assertEqual(response_audittrail.status_code, status.HTTP_200_OK)

        data = response_audittrail.data

        self.assertEqual(data[0]["user"]["pk"], record_manager.pk)
        self.assertEqual(
            data[0]["timestamp"],
            "2023-09-15T21:36:00+02:00",
        )
        self.assertEqual(
            data[0]["message"].strip(),
            _(
                "User %(user)s (member of group %(groups)s) has reassigned destruction list "
                '"%(list_name)s".'
            )
            % {
                "list_name": "Test audittrail",
                "user": record_manager,
                "groups": "Record Manager",
            },
        )
        self.assertEqual(
            data[0]["extra_data"]["assignee"]["user"],
            {
                "email": other_reviewer.email,
                "pk": other_reviewer.pk,
                "username": other_reviewer.username,
            },
        )

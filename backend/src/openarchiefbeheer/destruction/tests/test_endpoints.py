from django.utils.translation import gettext_lazy as _

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import (
    DestructionListItemAction,
    ListItemStatus,
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
)
from ..models import (
    DestructionList,
    DestructionListItemReview,
    DestructionListReview,
    ReviewItemResponse,
    ReviewResponse,
)
from .factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
    ReviewItemResponseFactory,
    ReviewResponseFactory,
)


class DestructionListViewSetTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:destructionlist-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(role__can_start_destruction=False)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:destructionlist-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_destruction_list(self):
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        user1 = UserFactory.create(
            username="reviewer1", role__can_review_destruction=True
        )
        user2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse("api:destructionlist-list")

        response = self.client.post(
            endpoint,
            data={
                "name": "A test list",
                "contains_sensitive_info": True,
                "assignees": [
                    {"user": user1.pk, "order": 0},
                    {"user": user2.pk, "order": 1},
                ],
                "items": [
                    {
                        "zaak": "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                        "extra_zaak_data": {},
                    },
                    {
                        "zaak": "http://localhost:8003/zaken/api/v1/zaken/222-222-222",
                        "extra_zaak_data": {},
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        destruction_list = DestructionList.objects.get(name="A test list")

        assignees = destruction_list.assignees.order_by("order")

        self.assertEqual(assignees.count(), 3)
        self.assertEqual(assignees[0].user.username, "record_manager")
        self.assertEqual(assignees[0].role, ListRole.author)
        self.assertEqual(assignees[1].user.username, "reviewer1")
        self.assertEqual(assignees[1].role, ListRole.reviewer)
        self.assertEqual(assignees[2].user.username, "reviewer2")
        self.assertEqual(assignees[2].role, ListRole.reviewer)

        items = destruction_list.items.order_by("zaak")

        self.assertEqual(items.count(), 2)
        self.assertEqual(
            items[0].zaak, "http://localhost:8003/zaken/api/v1/zaken/111-111-111"
        )
        self.assertEqual(
            items[1].zaak, "http://localhost:8003/zaken/api/v1/zaken/222-222-222"
        )

        self.assertEqual(destruction_list.author, record_manager)

    def test_list_destruction_lists(self):
        user = UserFactory.create()
        DestructionListFactory.create_batch(3)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:destructionlist-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 3)

    def test_zaak_already_in_another_destruction_list(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        user1 = UserFactory.create(
            username="reviewer1", role__can_review_destruction=True
        )
        user2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )
        DestructionListItemFactory.create(
            zaak="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse("api:destructionlist-list")

        response = self.client.post(
            endpoint,
            data={
                "name": "A test list",
                "contains_sensitive_info": True,
                "assignees": [
                    {"user": user1.pk, "order": 0},
                    {"user": user2.pk, "order": 1},
                ],
                "items": [
                    {
                        "zaak": "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                        "extra_zaak_data": {},
                    },
                    {
                        "zaak": "http://localhost:8003/zaken/api/v1/zaken/222-222-222",
                        "extra_zaak_data": {},
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()

        self.assertEqual(
            data,
            {
                "items": [
                    {
                        "zaak": [
                            _(
                                "This case was already included in another destruction list and was"
                                " not exempt during the review process."
                            )
                        ]
                    },
                    {},
                ]
            },
        )

        self.assertFalse(DestructionList.objects.filter(name="A test list").exists())

    def test_update_destruction_list(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        user1 = UserFactory.create(
            username="reviewer1", role__can_review_destruction=True
        )
        user2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )
        user3 = UserFactory.create(
            username="reviewer3", role__can_review_destruction=True
        )

        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.new,
        )
        destruction_list.bulk_create_reviewers(
            [{"user": user1, "order": 0}, {"user": user2, "order": 1}]
        )
        DestructionListItemFactory.create_batch(
            2,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )

        data = {
            "name": "An updated test list",
            "contains_sensitive_info": False,
            "assignees": [
                {"user": user1.pk, "order": 0},
                {"user": user3.pk, "order": 1},
            ],
            "items": [
                {
                    "zaak": "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                    "extra_zaak_data": {"key": "value"},
                },
            ],
        }
        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
        )

        response = self.client.put(
            endpoint,
            data=data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.name, "An updated test list")
        self.assertEqual(destruction_list.items.all().count(), 1)
        self.assertEqual(
            destruction_list.assignees.all().order_by("order")[1].user.pk, user3.pk
        )

    def test_cannot_update_destruction_list_if_not_new(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.ready_to_review,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.put(
            endpoint,
            data={
                "name": "An updated test list",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_update_destruction_list_if_not_author(self):
        record_manager1 = UserFactory.create(role__can_start_destruction=True)
        record_manager2 = UserFactory.create(role__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager1,
            status=ListStatus.new,
        )

        self.client.force_authenticate(user=record_manager2)
        endpoint = reverse(
            "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.put(
            endpoint,
            data={
                "name": "An updated test list",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_partially_update_destruction_list(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        user1 = UserFactory.create(
            username="reviewer1", role__can_review_destruction=True
        )
        user2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )

        destruction_list = DestructionListFactory.create(
            name="A test list", contains_sensitive_info=True
        )
        destruction_list.bulk_create_reviewers(
            [{"user": user1, "order": 0}, {"user": user2, "order": 1}]
        )
        DestructionListItemFactory.create_batch(
            2,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )

        data = {
            "name": "An updated test list",
        }
        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
        )

        response = self.client.patch(
            endpoint,
            data=data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.name, "An updated test list")
        self.assertEqual(destruction_list.items.all().count(), 2)
        self.assertEqual(destruction_list.assignees.all().count(), 2)

    def test_destruction_list_filter_on_assignee(self):
        user = UserFactory.create()
        reviewer1 = UserFactory.create()
        reviewer2 = UserFactory.create()
        lists = DestructionListFactory.create_batch(3)
        lists[0].assignee = reviewer1
        lists[1].save()
        lists[1].assignee = reviewer2
        lists[1].save()
        lists[2].assignee = reviewer2
        lists[2].save()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:destructionlist-list"))
        endpoint.args["assignee"] = reviewer2.pk

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)
        self.assertEqual(
            [destruction_list["uuid"] for destruction_list in response.json()].sort(),
            [lists[0].uuid, lists[1].uuid].sort(),
        )


class DestructionListItemsViewSetTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:destruction-list-items-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_destruction_list_items(self):
        record_manager = UserFactory.create(username="record_manager")
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/111-111-111", omschrijving="Description 1"
        )
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/222-222-222", omschrijving="Description 2"
        )

        DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/333-333-333",
            status=ListItemStatus.removed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse("api:destruction-list-items-list")

        response = self.client.get(
            endpoint,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = sorted(response.json(), key=lambda item: item["zaak"])

        self.assertEqual(
            data[0]["zaakData"]["omschrijving"],
            "Description 1",
        )
        self.assertEqual(
            data[1]["zaakData"]["omschrijving"],
            "Description 2",
        )
        self.assertIsNone(data[2]["zaakData"])

    def test_filter_items_on_destruction_list(self):
        record_manager = UserFactory.create(username="record_manager")
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/111-111-111", omschrijving="Description 1"
        )
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/222-222-222", omschrijving="Description 2"
        )

        destruction_list = DestructionListFactory.create()
        DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
            destruction_list=destruction_list,
        )
        DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
            destruction_list=destruction_list,
        )
        DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/333-333-333",
            status=ListItemStatus.removed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["destruction_list"] = destruction_list.pk

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)


class DestructionListReviewViewSetTest(APITestCase):
    def test_no_auth(self):
        endpoint = reverse("api:destruction-list-reviews-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_on_destruction_list(self):
        reviews = DestructionListReviewFactory.create_batch(3)
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:destruction-list-reviews-list"))
        endpoint.args["destruction_list__uuid"] = str(reviews[0].destruction_list.uuid)

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)

    def test_create_review(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(assignee=reviewer)
        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            user=reviewer,
            role=ListRole.reviewer,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        self.client.force_authenticate(user=reviewer)
        response = self.client.post(
            reverse("api:destruction-list-reviews-list"), data=data
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            DestructionListReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            1,
        )

    def test_create_review_rejected(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(assignee=reviewer)
        items = DestructionListItemFactory.create_batch(
            3, destruction_list=destruction_list
        )
        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.rejected,
            "list_feedback": "I disagree with this list",
            "zaken_reviews": [
                {
                    "zaak_url": items[0].zaak,
                    "feedback": "This item should not be deleted.",
                },
                {
                    "zaak_url": items[1].zaak,
                    "feedback": "We should wait to delete this.",
                },
            ],
        }
        self.client.force_authenticate(user=reviewer)
        response = self.client.post(
            reverse("api:destruction-list-reviews-list"), data=data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            DestructionListReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            1,
        )
        self.assertEqual(
            DestructionListItemReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            2,
        )

    def test_list_with_ordering(self):
        reviews = DestructionListReviewFactory.create_batch(3)
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:destruction-list-reviews-list"))
        endpoint.args["ordering"] = "-created"

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(reviews[-1].pk, data[0]["pk"])
        self.assertEqual(reviews[-2].pk, data[1]["pk"])
        self.assertEqual(reviews[-3].pk, data[2]["pk"])

    def test_filter_on_decision(self):
        DestructionListReviewFactory.create_batch(
            3, decision=ReviewDecisionChoices.accepted
        )
        reviews_rejected = DestructionListReviewFactory.create_batch(
            2, decision=ReviewDecisionChoices.rejected
        )
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:destruction-list-reviews-list"))
        endpoint.args["decision"] = ReviewDecisionChoices.rejected

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        expected_pks = [review.pk for review in reviews_rejected]
        self.assertIn(data[0]["pk"], expected_pks)
        self.assertIn(data[1]["pk"], expected_pks)
        self.assertEqual(len(data), 2)


class DestructionListItemReviewViewSetTests(APITestCase):
    def test_no_auth(self):
        endpoint = reverse("api:reviews-items-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_on_review(self):
        user = UserFactory.create()

        reviews = DestructionListReviewFactory.create_batch(2)
        DestructionListItemReviewFactory.create_batch(3, review=reviews[0])
        item_reviews = DestructionListItemReviewFactory.create_batch(
            2, review=reviews[1]
        )

        endpoint = furl(reverse("api:reviews-items-list"))
        endpoint.args["review"] = reviews[1].pk

        self.client.force_authenticate(user=user)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)
        expected_pks = [item_review.pk for item_review in item_reviews]
        self.assertIn(data[0]["pk"], expected_pks)
        self.assertIn(data[1]["pk"], expected_pks)

    def test_with_deleted_zaken(self):
        user = UserFactory.create()

        zaak = ZaakFactory.create()
        DestructionListItemReviewFactory.create(destruction_list_item__zaak=zaak.url)

        zaak.delete()

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:reviews-items-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data[0]["zaak"].keys()), 1)


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
        record_manager = UserFactory.create(role__can_start_destruction=True)
        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager,
        )
        items_reviews = DestructionListItemReviewFactory.create_batch(
            3,
            destruction_list_item__destruction_list=review.destruction_list,
            review=review,
        )

        endpoint = reverse("api:review-responses-list")
        self.client.force_authenticate(user=record_manager)

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
                        "actionZaak": {"selectielijstklasse": "http://some-url.nl"},
                        "comment": "Changed the selectielijstklasse and removed from the list.",
                    },
                    {
                        "reviewItem": items_reviews[2].pk,
                        "actionItem": DestructionListItemAction.remove,
                        "actionZaak": {"archiefactiedatum": "2030-01-01"},
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

        item_response3 = ReviewItemResponse.objects.get(review_item=items_reviews[2].pk)

        self.assertEqual(item_response3.action_zaak["archiefactiedatum"], "2030-01-01")

    def test_cannot_create_response_if_not_author(self):
        record_manager1 = UserFactory.create(role__can_start_destruction=True)
        record_manager2 = UserFactory.create(role__can_start_destruction=True)

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

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["nonFieldErrors"][0],
            _(
                "This user is either not allowed to update the destruction list or "
                "the destruction list cannot currently be updated."
            ),
        )

    def test_cannot_create_response_if_not_changes_requested(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)

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

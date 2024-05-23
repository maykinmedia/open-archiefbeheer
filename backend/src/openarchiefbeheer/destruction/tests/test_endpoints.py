from django.utils.translation import gettext_lazy as _

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.models import DestructionList
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
)
from openarchiefbeheer.zaken.tests.factories import ZaakFactory


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
        record_manager = UserFactory.create(role__can_start_destruction=True)
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

        self.assertEqual(assignees.count(), 2)
        self.assertEqual(assignees[0].user.username, "reviewer1")
        self.assertEqual(assignees[1].user.username, "reviewer2")

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
            name="A test list", contains_sensitive_info=True
        )
        destruction_list.bulk_create_assignees(
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
            "api:destructionlist-detail", kwargs={"pk": destruction_list.pk}
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
        destruction_list.bulk_create_assignees(
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
            "api:destructionlist-detail", kwargs={"pk": destruction_list.pk}
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

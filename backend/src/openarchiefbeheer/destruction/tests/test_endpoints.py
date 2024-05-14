from django.utils.translation import gettext_lazy as _

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

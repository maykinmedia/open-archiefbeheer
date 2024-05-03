from datetime import datetime

from django.core import mail
from django.test import TestCase
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from freezegun import freeze_time
from rest_framework.test import APIRequestFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.api.serializers import DestructionListSerializer
from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory

factory = APIRequestFactory()


class DestructionListSerializerTests(TestCase):
    def test_create_destruction_list(self):
        user1 = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
        )
        user2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )

        request = factory.get("/foo")
        request.user = record_manager

        data = {
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
        }

        serializer = DestructionListSerializer(data=data, context={"request": request})

        self.assertTrue(serializer.is_valid())

        with freeze_time("2024-05-02T16:00:00+02:00"):
            destruction_list = serializer.save()

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
        self.assertEqual(destruction_list.assignee, user1)
        self.assertEqual(
            assignees[0].assigned_on,
            timezone.make_aware(datetime(2024, 5, 2, 16, 0)),
        )

        sent_mail = mail.outbox

        self.assertEqual(len(sent_mail), 1)
        self.assertEqual(sent_mail[0].subject, _("Destruction list review request"))
        self.assertEqual(sent_mail[0].recipients(), ["reviewer1@oab.nl"])

    def test_zaak_already_included_in_other_list(self):
        user1 = UserFactory.create(
            username="reviewer1", role__can_review_destruction=True
        )
        user2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )

        DestructionListItemFactory.create(
            zaak="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
        )

        request = factory.get("/foo")
        request.user = record_manager

        data = {
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
        }

        serializer = DestructionListSerializer(data=data, context={"request": request})

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["items"][0]["zaak"],
            [
                _(
                    "This case was already included in another destruction list and was not exempt during the review process."
                )
            ],
        )

    def test_zaak_already_included_in_other_list_but_exempt(self):
        user1 = UserFactory.create(
            username="reviewer1", role__can_review_destruction=True
        )
        user2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )

        DestructionListItemFactory.create(
            zaak="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            status=ListItemStatus.removed,
        )

        request = factory.get("/foo")
        request.user = record_manager

        data = {
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
        }

        serializer = DestructionListSerializer(data=data, context={"request": request})

        self.assertTrue(serializer.is_valid())

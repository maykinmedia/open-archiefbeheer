from datetime import datetime
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, tag
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from freezegun import freeze_time
from rest_framework.test import APIRequestFactory
from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.emails.models import EmailConfig

from ..api.serializers import DestructionListSerializer
from ..constants import ListItemStatus
from ..models import DestructionListItem
from .factories import DestructionListFactory, DestructionListItemFactory

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

        with (
            patch(
                "openarchiefbeheer.emails.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_review_required="Destruction list review request"
                ),
            ),
            freeze_time("2024-05-02T16:00:00+02:00"),
        ):
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
        self.assertEqual(sent_mail[0].subject, "Destruction list review request")
        self.assertEqual(sent_mail[0].recipients(), ["reviewer1@oab.nl"])

        logs = TimelineLog.objects.filter(user=record_manager)

        self.assertEqual(logs.count(), 1)

        message = logs[0].get_message()

        self.assertEqual(
            message,
            '[2024-05-02T16:00:00+02:00]: Destruction list "A test list" created by user record_manager.',
        )

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

    def test_full_list_update(self):
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

        serializer = DestructionListSerializer(instance=destruction_list, data=data)
        self.assertTrue(serializer.is_valid())

        with freeze_time("2024-05-02T16:00:00+02:00"):
            serializer.save()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.name, "An updated test list")

        items = destruction_list.items.all()

        self.assertEqual(items.count(), 1)
        self.assertEqual(items[0].extra_zaak_data["key"], "value")

        assignees = destruction_list.assignees.all().order_by("order")

        self.assertEqual(assignees[0].user.pk, user1.pk)
        self.assertEqual(assignees[1].user.pk, user3.pk)

        logs = TimelineLog.objects.filter(
            template="logging/destruction_list_updated.txt"
        )

        self.assertEqual(logs.count(), 1)

        message = logs[0].get_message()

        self.assertEqual(
            message,
            '[2024-05-02T16:00:00+02:00]: Destruction list "An updated test list" was updated.',
        )

    def test_partial_list_update(self):
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

        serializer = DestructionListSerializer(
            instance=destruction_list, data=data, partial=True
        )

        self.assertTrue(serializer.is_valid())

        serializer.save()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.name, "An updated test list")
        self.assertEqual(destruction_list.items.all().count(), 2)
        self.assertEqual(destruction_list.assignees.all().count(), 2)

    def test_partial_update_with_zaken(self):
        destruction_list = DestructionListFactory.create(
            name="A test list", contains_sensitive_info=True
        )
        items = DestructionListItemFactory.create_batch(
            4,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )

        # We are removing 2 zaken from the destruction list
        data = {
            "items": [{"zaak": items[0].zaak}, {"zaak": items[1].zaak}],
        }

        serializer = DestructionListSerializer(
            instance=destruction_list, data=data, partial=True
        )

        self.assertTrue(serializer.is_valid())

        serializer.save()

        items = DestructionListItem.objects.filter(destruction_list=destruction_list)
        items_in_list = items.values_list("zaak", flat=True)

        self.assertEqual(items_in_list.count(), 2)
        self.assertIn(data["items"][0]["zaak"], items_in_list)
        self.assertIn(data["items"][1]["zaak"], items_in_list)

    @tag("gh-58")
    def test_create_destruction_list_with_same_reviewer_twice(self):
        user1 = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
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
                {"user": user1.pk, "order": 1},
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
            serializer.errors["assignees"][0],
            _("The same user should not be selected as a reviewer more than once."),
        )

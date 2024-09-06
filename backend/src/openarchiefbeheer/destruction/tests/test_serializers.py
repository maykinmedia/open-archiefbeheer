from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings, tag
from django.utils.translation import gettext_lazy as _
from freezegun import freeze_time
from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.emails.models import EmailConfig
from rest_framework.test import APIRequestFactory
from timeline_logger.models import TimelineLog

from ...zaken.tests.factories import ZaakFactory
from ..api.serializers import (DestructionListReviewSerializer,
                               DestructionListSerializer)
from ..constants import (ListItemStatus, ListRole, ListStatus,
                         ReviewDecisionChoices)
from ..models import (DestructionListItem, DestructionListItemReview,
                      DestructionListReview)
from .factories import (DestructionListAssigneeFactory, DestructionListFactory,
                        DestructionListItemFactory)

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
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
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

        with (freeze_time("2024-05-02T16:00:00+02:00"),):
            destruction_list = serializer.save()

        assignees = destruction_list.assignees.order_by("pk")

        self.assertEqual(assignees.count(), 3)
        self.assertEqual(assignees[0].user.username, "record_manager")
        self.assertEqual(assignees[1].user.username, "reviewer1")
        self.assertEqual(assignees[2].user.username, "reviewer2")

        items = destruction_list.items.order_by("zaak__url")

        self.assertEqual(items.count(), 2)
        self.assertEqual(
            items[0].zaak.url, "http://localhost:8003/zaken/api/v1/zaken/111-111-111"
        )
        self.assertEqual(
            items[1].zaak.url, "http://localhost:8003/zaken/api/v1/zaken/222-222-222"
        )

        self.assertEqual(destruction_list.author, record_manager)
        self.assertEqual(destruction_list.status, ListStatus.new)
        self.assertEqual(destruction_list.assignee, destruction_list.author)

        sent_mail = mail.outbox

        self.assertEqual(len(sent_mail), 0)

        logs = TimelineLog.objects.filter(user=record_manager)

        self.assertEqual(logs.count(), 1)

        message = logs[0].get_message()

        self.assertEqual(
            message,
            'Vernietigingslijst "A test list" aangemaakt door gebruiker record_manager.',
        )

    def test_destruction_list_with_short_procedure_requires_multiple_reviewers(self):
        reviewer = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
        )
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        zaak = ZaakFactory.create()
        request = factory.get("/foo")
        request.user = record_manager

        with patch(
            "openarchiefbeheer.config.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(zaaktypes_short_process=[zaak.zaaktype]),
        ):
            data = {
                "name": "A test list",
                "contains_sensitive_info": True,
                "assignees": [
                    {"user": reviewer.pk, "order": 0},
                ],
                "items": [
                    {
                        "zaak": zaak.url,
                        "extra_zaak_data": {},
                    },
                ],
            }
            serializer = DestructionListSerializer(
                data=data, context={"request": request}
            )
            self.assertTrue(serializer.is_valid())

    def test_destruction_list_without_short_procedure_requires_multiple_reviewers(self):
        reviewer = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
        )
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        zaak = ZaakFactory.create()
        request = factory.get("/foo")
        request.user = record_manager

        data = {
            "name": "A test list",
            "contains_sensitive_info": True,
            "assignees": [
                {"user": reviewer.pk, "order": 0},
            ],
            "items": [
                {
                    "zaak": zaak.url,
                    "extra_zaak_data": {},
                },
            ],
        }

        serializer = DestructionListSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())

        self.assertIn(
            "A destruction list without a short reviewing process must have more than 1 reviewer.",
            serializer.errors["non_field_errors"],
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

        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
        )

        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
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

        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
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
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )

        destruction_list = DestructionListFactory.create(
            name="A test list", contains_sensitive_info=True, author=record_manager
        )
        DestructionListItemFactory.create_batch(
            2,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        data = {
            "name": "An updated test list",
            "contains_sensitive_info": False,
            "items": [
                {
                    "zaak": "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                },
            ],
        }
        request = factory.get("/foo")
        request.user = record_manager

        serializer = DestructionListSerializer(
            instance=destruction_list, data=data, context={"request": request}
        )
        self.assertTrue(serializer.is_valid())

        with freeze_time("2024-05-02T16:00:00+02:00"):
            serializer.save()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.name, "An updated test list")

        items = destruction_list.items.all()

        self.assertEqual(items.count(), 1)

        logs = TimelineLog.objects.filter(
            template="logging/destruction_list_updated.txt"
        )

        self.assertEqual(logs.count(), 1)

        message = logs[0].get_message()

        self.assertEqual(message, 'Vernietigingslijst "An updated test list" is bijgewerkt.')

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
            [{"user": user1}, {"user": user2}],
            role=ListRole.reviewer,
        )
        DestructionListItemFactory.create_batch(
            2,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )

        data = {
            "name": "An updated test list",
        }

        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        request = factory.get("/foo")
        request.user = record_manager

        serializer = DestructionListSerializer(
            instance=destruction_list,
            data=data,
            partial=True,
            context={"request": request},
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
            with_zaak=True,
        )

        # We are removing 2 zaken from the destruction list
        data = {
            "items": [{"zaak": items[0].zaak.url}, {"zaak": items[1].zaak.url}],
        }

        record_manager = UserFactory.create(role__can_start_destruction=True)
        request = factory.get("/foo")
        request.user = record_manager

        serializer = DestructionListSerializer(
            instance=destruction_list,
            data=data,
            partial=True,
            context={"request": request},
        )

        self.assertTrue(serializer.is_valid())

        serializer.save()

        items = DestructionListItem.objects.filter(destruction_list=destruction_list)
        items_in_list = items.values_list("zaak__url", flat=True)

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
            serializer.errors["assignees"]["non_field_errors"][0],
            _("The same user should not be selected as a reviewer more than once."),
        )

    @tag("gh-122")
    def test_assign_author_as_reviewer(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
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
                {"user": reviewer.pk, "order": 0},
                {"user": record_manager.pk, "order": 1},
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
            serializer.errors["assignees"]["non_field_errors"][0],
            _("The author of a list cannot also be a reviewer."),
        )

    def test_create_list_with_bulk_select_cases(self):
        reviewer1 = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
        )
        reviewer2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            omschrijving="AAAAA",
        )
        # This zaak SHOULD be selected because it was removed from a destruction list
        DestructionListItemFactory.create(
            status=ListItemStatus.removed,
            with_zaak=True,
            zaak__omschrijving="AAAAA",
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
        )
        # This zaak should NOT be selected because its omschrijving does not match the filter
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/333-333-333",
            omschrijving="BBBBB",
        )
        # This zaak should NOT be selected because it is already in a destruction list
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__omschrijving="AAAAA",
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/444-444-444",
        )

        request = factory.get("/foo")
        request.user = record_manager

        data = {
            "name": "A test list",
            "contains_sensitive_info": True,
            "assignees": [
                {"user": reviewer1.pk},
                {"user": reviewer2.pk},
            ],
            "select_all": True,
            "zaak_filters": {"omschrijving": "AAAAA"},
        }

        serializer = DestructionListSerializer(data=data, context={"request": request})
        is_valid = serializer.is_valid()

        self.assertTrue(is_valid)

        with (freeze_time("2024-05-02T16:00:00+02:00"),):
            destruction_list = serializer.save()

        self.assertEqual(destruction_list.items.count(), 2)
        self.assertEqual(destruction_list.items.all()[0].zaak.omschrijving, "AAAAA")
        self.assertEqual(destruction_list.items.all()[1].zaak.omschrijving, "AAAAA")
        self.assertFalse(
            destruction_list.items.filter(
                zaak__url="http://localhost:8003/zaken/api/v1/zaken/444-444-444"
            ).exists()
        )

    def test_create_list_with_bulk_select_cases_no_filters(self):
        reviewer1 = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
        )
        reviewer2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            omschrijving="AAAAA",
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
            omschrijving="AAAAA",
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/333-333-333",
            omschrijving="BBBBB",
        )

        request = factory.get("/foo")
        request.user = record_manager

        data = {
            "name": "A test list",
            "contains_sensitive_info": True,
            "assignees": [
                {"user": reviewer1.pk},
                {"user": reviewer2.pk},
            ],
            "select_all": True,
        }

        serializer = DestructionListSerializer(data=data, context={"request": request})
        is_valid = serializer.is_valid()

        self.assertTrue(is_valid)

        with (freeze_time("2024-05-02T16:00:00+02:00"),):
            destruction_list = serializer.save()

        self.assertEqual(destruction_list.items.count(), 3)

    def test_no_bulk_select_and_no_items(self):
        reviewer1 = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
        )
        reviewer2 = UserFactory.create(
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
                {"user": reviewer1.pk},
                {"user": reviewer2.pk},
            ],
        }

        serializer = DestructionListSerializer(data=data, context={"request": request})
        is_valid = serializer.is_valid()

        self.assertFalse(is_valid)
        self.assertEqual(
            serializer.errors["non_field_errors"][0],
            "Neither the 'items' nor the 'select_all' field have been specified.",
        )

    def test_zaak_filters_validation(self):
        reviewer1 = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
        )
        reviewer2 = UserFactory.create(
            username="reviewer2", role__can_review_destruction=True
        )
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )

        request = factory.get("/foo")
        request.user = record_manager

        with self.subTest("Invalid filter"):
            data = {
                "name": "A test list",
                "contains_sensitive_info": True,
                "assignees": [
                    {"user": reviewer1.pk},
                    {"user": reviewer2.pk},
                ],
                "select_all": True,
                "zaak_filters": {"uuid": "AAAAA"},
            }

            serializer = DestructionListSerializer(
                data=data, context={"request": request}
            )
            is_valid = serializer.is_valid()

            self.assertFalse(is_valid)
            self.assertEqual(serializer.errors["zaak_filters"][0], "Invalid filter(s).")

        with self.subTest("Wrong type filter object"):
            data = {
                "name": "A test list",
                "contains_sensitive_info": True,
                "assignees": [
                    {"user": reviewer1.pk},
                    {"user": reviewer2.pk},
                ],
                "select_all": True,
                "zaak_filters": "Tralala I should be an object.",
            }

        serializer = DestructionListSerializer(data=data, context={"request": request})
        is_valid = serializer.is_valid()

        self.assertFalse(is_valid)
        self.assertEqual(
            serializer.errors["zaak_filters"][0], "Should be a JSON object."
        )

    def test_update_with_bulk_select(self):
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )

        destruction_list = DestructionListFactory.create(
            name="A test list", contains_sensitive_info=True, author=record_manager
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            omschrijving="AAAAA",
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
            omschrijving="BBBBB",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__omschrijving="AAAAA",
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/333-333-333",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__omschrijving="AAAAA",
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/444-444-444",
        )

        data = {
            "name": "An updated test list",
            "contains_sensitive_info": False,
            "select_all": True,
            "zaak_filters": {"omschrijving": "AAAAA"},
        }
        request = factory.get("/foo")
        request.user = record_manager

        serializer = DestructionListSerializer(
            instance=destruction_list, data=data, context={"request": request}
        )
        self.assertTrue(serializer.is_valid())

        with freeze_time("2024-05-02T16:00:00+02:00"):
            serializer.save()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.items.count(), 3)

        items = destruction_list.items.all()

        self.assertEqual(items[0].zaak.omschrijving, "AAAAA")
        self.assertEqual(items[1].zaak.omschrijving, "AAAAA")
        self.assertEqual(items[1].zaak.omschrijving, "AAAAA")
        self.assertFalse(
            items.filter(
                zaak__url="http://localhost:8003/zaken/api/v1/zaken/222-222-222"
            ).exists()
        )


class DestructionListReviewSerializerTests(TestCase):
    def test_if_user_not_assigned_cannot_create_review(self):
        reviewer1 = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
        )
        reviewer2 = UserFactory.create(
            username="reviewer2",
            email="reviewer2@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(assignee=reviewer1)

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        request = factory.get("/foo")
        request.user = reviewer2

        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["author"][0],
            _(
                "This user is not currently assigned to the destruction list, "
                "so they cannot create a review at this stage."
            ),
        )

    @override_settings(LANGUAGE_CODE="en")
    def test_if_list_in_wrong_status_cannot_be_reviewed(self):
        user = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=True,
            role__can_review_final_list=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=user, status=ListStatus.changes_requested
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        request = factory.get("/foo")
        request.user = user

        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["author"][0],
            _(
                "The status of this destruction list prevents you from creating a review at this stage."
            ),
        )

    @override_settings(LANGUAGE_CODE="en")
    def test_if_user_not_a_reviewer_cannot_create_review(self):
        user = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_destruction=False,
        )
        destruction_list = DestructionListFactory.create(
            assignee=user, status=ListStatus.ready_to_review
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        request = factory.get("/foo")
        request.user = user

        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["author"][0],
            _(
                "The status of this destruction list prevents you from creating a review at this stage."
            ),
        )

    @override_settings(LANGUAGE_CODE="en")
    def test_if_user_not_an_archivist_cannot_create_review(self):
        user = UserFactory.create(
            username="reviewer1",
            email="reviewer1@oab.nl",
            role__can_review_final_list=False,
        )
        destruction_list = DestructionListFactory.create(
            assignee=user, status=ListStatus.ready_for_archivist
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        request = factory.get("/foo")
        request.user = user

        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["author"][0],
            _(
                "The status of this destruction list prevents you from creating a review at this stage."
            ),
        )

    @override_settings(LANGUAGE_CODE="en")
    def test_create_review_accepted_first_reviewer(self):
        reviewer1 = UserFactory.create(
            username="reviewer1",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        reviewer2 = UserFactory.create(
            username="reviewer2",
            email="reviewer2@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            name="Test list",
            assignee=reviewer1,
            status=ListStatus.ready_to_review,
            author__email="record_manager@oab.nl",
        )
        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            user=reviewer1,
            role=ListRole.reviewer,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            user=reviewer2,
            role=ListRole.reviewer,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        request = factory.get("/foo")
        request.user = reviewer1

        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertTrue(serializer.is_valid())

        with (
            freeze_time("2024-05-02T16:00:00+02:00"),
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_review_required="Destruction list review request",
                    body_review_required="Please review the list",
                    subject_positive_review="A reviewer approved!",
                    body_positive_review="A reviewer approved!",
                ),
            ),
        ):
            serializer.save()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.assignee, reviewer2)
        self.assertEqual(destruction_list.status, ListStatus.ready_to_review)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].subject, "A reviewer approved!")
        self.assertEqual(mail.outbox[0].recipients(), ["record_manager@oab.nl"])
        self.assertEqual(mail.outbox[1].subject, "Destruction list review request")
        self.assertEqual(mail.outbox[1].recipients(), ["reviewer2@oab.nl"])

        logs = destruction_list.logs.all()

        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].user, reviewer1)
        self.assertTrue(logs[0].extra_data["approved"])
        self.assertEqual(
            logs[0].get_message(),
            'Gebruiker "reviewer1" heeft de lijst "Test list" beoordeeld. Ze hebben de lijst goedgekeurd.\n',
        )

    def test_create_review_accepted_last_reviewer(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer,
            author__email="record_manager@oab.nl",
            status=ListStatus.ready_to_review,
        )
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
        request = factory.get("/foo")
        request.user = reviewer

        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertTrue(serializer.is_valid())

        with (
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_last_review="Last review accepted",
                    body_last_review="Yuppiii last reviewer accepted!",
                ),
            ),
        ):
            serializer.save()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.assignee, destruction_list.author)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Last review accepted")
        self.assertEqual(mail.outbox[0].recipients(), ["record_manager@oab.nl"])

        logs = destruction_list.logs.all()

        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].user, reviewer)
        self.assertTrue(logs[0].extra_data["approved"])

    def test_create_review_accepted_cannot_have_item_reviews(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )
        item = DestructionListItemFactory.create(
            destruction_list=destruction_list, with_zaak=True
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
            "list_feedback": "This is a list with inconsisten feedback.",
            "zaken_reviews": [
                {
                    "zaak_url": item.zaak.url,
                    "feedback": "This item should not be deleted.",
                },
            ],
        }

        request = factory.get("/foo")
        request.user = reviewer
        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["zaken_reviews"][0],
            _("There cannot be feedback on the cases if the list is approved."),
        )

    def test_create_review_rejected_must_have_item_reviews(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.rejected,
        }
        request = factory.get("/foo")
        request.user = reviewer

        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["zaken_reviews"][0],
            _("This field cannot be empty if changes are requested on the list."),
        )

    @override_settings(LANGUAGE_CODE="en")
    def test_create_review_rejected(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, name="Test list", status=ListStatus.ready_to_review
        )
        items = DestructionListItemFactory.create_batch(
            3, destruction_list=destruction_list, with_zaak=True
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
                    "zaak_url": items[0].zaak.url,
                    "feedback": "This item should not be deleted.",
                },
                {
                    "zaak_url": items[1].zaak.url,
                    "feedback": "We should wait to delete this.",
                },
            ],
        }

        request = factory.get("/foo")
        request.user = reviewer
        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertTrue(serializer.is_valid())

        with freeze_time("2024-05-02T16:00:00+02:00"):
            serializer.save()

        self.assertEqual(DestructionListReview.objects.count(), 1)
        self.assertEqual(DestructionListItemReview.objects.count(), 2)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.assignee, destruction_list.author)
        self.assertEqual(destruction_list.status, ListStatus.changes_requested)

        logs = destruction_list.logs.all()

        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].user, reviewer)
        self.assertFalse(logs[0].extra_data["approved"])
        self.assertEqual(
            logs[0].get_message(),
            'Gebruiker "reviewer" heeft de lijst "Test list" beoordeeld. Ze hebben wijzigingen in de lijst aangevraagd.\n',
        )

    def test_reviewing_cases_not_in_destruction_list(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )
        # Not part of the destruction list
        item = DestructionListItemFactory.create(
            status=ListItemStatus.suggested, with_zaak=True
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.rejected,
            "list_feedback": "I disagree with this list",
            "zaken_reviews": [
                {
                    "zaak_url": item.zaak.url,
                    "feedback": "This item should not be deleted.",
                },
            ],
        }

        request = factory.get("/foo")
        request.user = reviewer
        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["zaken_reviews"][0],
            _(
                "You can only provide feedback about cases that are part of the destruction list."
            ),
        )

    def test_reviewing_cases_removed_from_destruction_list(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )
        item = DestructionListItemFactory.create(
            status=ListItemStatus.removed,
            destruction_list=destruction_list,
            with_zaak=True,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.rejected,
            "list_feedback": "I disagree with this list",
            "zaken_reviews": [
                {
                    "zaak_url": item.zaak.url,
                    "feedback": "This item should not be deleted.",
                },
            ],
        }

        request = factory.get("/foo")
        request.user = reviewer
        serializer = DestructionListReviewSerializer(
            data=data, context={"request": request}
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["zaken_reviews"][0],
            _(
                "You can only provide feedback about cases that are part of the destruction list."
            ),
        )

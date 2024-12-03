from datetime import date

from django.contrib.auth.models import Group
from django.utils.translation import gettext_lazy as _, ngettext

import freezegun
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import InternalStatus, ListStatus
from ..factories import DestructionListFactory


class DestructionListAbortEndpointTest(APITestCase):
    def test_only_record_manager_can_abort(self):
        reviewer = UserFactory.create(
            username="reviewer", post__can_start_destruction=False
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.new,
            planned_destruction_date=date(2024, 1, 8),
        )

        self.client.force_authenticate(user=reviewer)
        with freezegun.freeze_time("2024-01-05T12:00:00+01:00"):
            response = self.client.post(
                reverse(
                    "api:destructionlist-abort",
                    kwargs={"uuid": destruction_list.uuid},
                ),
                data={"comment": "PANIC! ABORT!"},
            )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_new_cannot_be_aborted(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.new,
            planned_destruction_date=None,
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-05T12:00:00+01:00"):
            response = self.client.post(
                reverse(
                    "api:destructionlist-abort",
                    kwargs={"uuid": destruction_list.uuid},
                ),
                data={"comment": "PANIC! ABORT!"},
            )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_abort_without_comment(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.new,
            planned_destruction_date=date(2024, 1, 8),
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-05T12:00:00+01:00"):
            response = self.client.post(
                reverse(
                    "api:destructionlist-abort",
                    kwargs={"uuid": destruction_list.uuid},
                ),
                data={},
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["comment"][0], _("This field is required."))

    def test_abort_list_process(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        record_manager_group, created = Group.objects.get_or_create(
            name="Record Manager"
        )
        administrator_group, created = Group.objects.get_or_create(name="Administrator")
        record_manager.groups.add(record_manager_group)
        record_manager.groups.add(administrator_group)
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.ready_to_review,
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-05T12:00:00+01:00"):
            response = self.client.post(
                reverse(
                    "api:destructionlist-abort",
                    kwargs={"uuid": destruction_list.uuid},
                ),
                data={"comment": "PANIC! ABORT!"},
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.new)
        self.assertEqual(destruction_list.processing_status, InternalStatus.new)
        self.assertEqual(destruction_list.assignee, record_manager)

        logs = TimelineLog.objects.for_object(destruction_list)

        self.assertEqual(len(logs), 1)

        message = logs[0].get_message()

        self.assertEqual(
            message,
            ngettext(
                'User %(record_manager)s (member of group %(groups)s) has aborted the review process of destruction list "%(list_name)s" with reason: %(comment)s.',
                'User %(record_manager)s (member of groups %(groups)s) has aborted the review process of destruction list "%(list_name)s" with reason: %(comment)s.',
                2,
            )
            % {
                "list_name": "A test list",
                "record_manager": str(record_manager),
                "comment": "PANIC! ABORT!",
                "groups": "Administrator, Record Manager",
            },
        )

    def test_abort_list_destruction(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        record_manager_group, created = Group.objects.get_or_create(
            name="Record Manager"
        )
        administrator_group, created = Group.objects.get_or_create(name="Administrator")
        record_manager.groups.add(record_manager_group)
        record_manager.groups.add(administrator_group)
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.new,
            planned_destruction_date=date(2024, 1, 8),
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-05T12:00:00+01:00"):
            response = self.client.post(
                reverse(
                    "api:destructionlist-abort",
                    kwargs={"uuid": destruction_list.uuid},
                ),
                data={"comment": "PANIC! ABORT!"},
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.new)
        self.assertEqual(destruction_list.processing_status, InternalStatus.new)
        self.assertEqual(destruction_list.assignee, record_manager)
        self.assertIsNone(destruction_list.planned_destruction_date)

        logs = TimelineLog.objects.for_object(destruction_list)

        self.assertEqual(len(logs), 1)

        message = logs[0].get_message()

        self.assertEqual(
            message,
            ngettext(
                'User %(record_manager)s (member of group %(groups)s) has aborted the destruction of destruction list "%(list_name)s" with reason: %(comment)s.',
                'User %(record_manager)s (member of groups %(groups)s) has aborted the destruction of destruction list "%(list_name)s" with reason: %(comment)s.',
                2,
            )
            % {
                "list_name": "A test list",
                "record_manager": str(record_manager),
                "comment": "PANIC! ABORT!",
                "groups": "Administrator, Record Manager",
            },
        )

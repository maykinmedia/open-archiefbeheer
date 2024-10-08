from datetime import date

from django.utils.translation import gettext_lazy as _

import freezegun
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import InternalStatus, ListStatus
from ..factories import DestructionListFactory


class DestructionListAbortDestructionEndpointTest(APITestCase):
    def test_only_author_can_abort(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.new,
            planned_destruction_date=date(2024, 1, 8),
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-05T12:00:00+01:00"):
            response = self.client.post(
                reverse(
                    "api:destructionlist-abort-destruction",
                    kwargs={"uuid": destruction_list.uuid},
                ),
                data={"comment": "PANIC! ABORT!"},
            )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_only_ready_to_delete_with_planned_date_can_be_aborted(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.new,
            planned_destruction_date=None,
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-05T12:00:00+01:00"):
            response = self.client.post(
                reverse(
                    "api:destructionlist-abort-destruction",
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
                    "api:destructionlist-abort-destruction",
                    kwargs={"uuid": destruction_list.uuid},
                ),
                data={},
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["comment"][0], _("This field is required."))

    def test_abort_list_destruction(self):
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
                    "api:destructionlist-abort-destruction",
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

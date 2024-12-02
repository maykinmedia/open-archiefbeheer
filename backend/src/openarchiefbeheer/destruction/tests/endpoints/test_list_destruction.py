from datetime import date
from unittest.mock import patch

from django.utils.translation import gettext_lazy as _

import freezegun
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import InternalStatus, ListItemStatus, ListStatus
from ..factories import DestructionListFactory, DestructionListItemFactory


class DestructionListStartDestructionEndpointTest(APITestCase):
    def test_plan_destruction(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.new,
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-01T21:36:00+02:00"):
            response = self.client.delete(
                reverse(
                    "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
                ),
            )

        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.processing_status, InternalStatus.new)
        self.assertEqual(destruction_list.status, ListStatus.ready_to_delete)
        self.assertEqual(destruction_list.planned_destruction_date, date(2024, 1, 8))

    def test_retry_destruction_after_failure_queues_immediately(
        self,
    ):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.ready_to_delete,
            planned_destruction_date=date(2023, 1, 1),
            processing_status=InternalStatus.failed,
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list, processing_status=InternalStatus.failed
        )

        self.client.force_authenticate(user=record_manager)
        with (
            freezegun.freeze_time("2024-01-01T21:36:00+02:00"),
            patch(
                "openarchiefbeheer.destruction.api.viewsets.delete_destruction_list"
            ) as m_delete,
        ):
            response = self.client.delete(
                reverse(
                    "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
                ),
            )

        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)
        m_delete.assert_called_once()
        self.assertEqual(m_delete.call_args_list[0].args[0].pk, destruction_list.pk)

    def test_retry_destruction_after_failure_with_planned_date_in_future_raises_error(
        self,
    ):
        """This scenario should never happen unless someone manually changes the planned destruction date."""
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.ready_to_delete,
            planned_destruction_date=date(2026, 1, 1),
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list, processing_status=InternalStatus.failed
        )
        self.client.force_authenticate(user=record_manager)
        with (freezegun.freeze_time("2024-01-01T21:36:00+02:00"),):
            response = self.client.delete(
                reverse(
                    "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
                ),
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()[0],
            _("This list is already planned to be destroyed on 08/01/2024."),
        )

    def test_can_start_destruction_if_not_author(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            status=ListStatus.ready_to_delete,
        )

        self.client.force_authenticate(user=record_manager)
        with patch(
            "openarchiefbeheer.destruction.api.viewsets.delete_destruction_list"
        ):
            response = self.client.delete(
                reverse(
                    "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
                ),
            )

        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)

    def test_cannot_start_destruction_if_not_ready_to_delete(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.ready_to_review,
        )

        self.client.force_authenticate(user=record_manager)
        with patch(
            "openarchiefbeheer.destruction.api.viewsets.delete_destruction_list"
        ) as m_task:
            response = self.client.delete(
                reverse(
                    "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
                ),
            )

        self.assertEqual(status.HTTP_403_FORBIDDEN, response.status_code)
        m_task.assert_not_called()

    def test_cannot_start_destruction_if_archiefactiedatum_in_the_future(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.ready_to_delete,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__archiefactiedatum=date(2025, 1, 1),
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__archiefactiedatum=date(2023, 1, 1),
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-01T21:36:00+02:00"):
            response = self.client.delete(
                reverse(
                    "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
                ),
            )

        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEqual(
            response.json()[0],
            _(
                "This list contains cases with archiving date later than %(destruction_date)s, "
                "so the destruction cannot be planned yet."
            )
            % {"destruction_date": "08/01/2024"},
        )

    def test_can_start_destruction_if_archiefactiedatum_in_the_future_but_removed(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.ready_to_delete,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__archiefactiedatum=date(2025, 1, 1),
            destruction_list=destruction_list,
            status=ListItemStatus.removed,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__archiefactiedatum=date(2023, 1, 1),
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )

        self.client.force_authenticate(user=record_manager)
        with freezegun.freeze_time("2024-01-01T21:36:00+02:00"):
            response = self.client.delete(
                reverse(
                    "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
                ),
            )

        self.assertEqual(status.HTTP_204_NO_CONTENT, response.status_code)

        logs = TimelineLog.objects.for_object(destruction_list).filter(
            template="logging/destruction_list_deletion_triggered.txt"
        )

        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].extra_data["user"]["username"], "record_manager")

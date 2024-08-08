import logging
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings

from requests_mock import Mocker
from testfixtures import log_capture
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
)
from ..tasks import (
    complete_and_notify,
    delete_destruction_list,
    delete_destruction_list_item,
    process_review_response,
)
from .factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    ReviewItemResponseFactory,
    ReviewResponseFactory,
)


@Mocker()
class ProcessReviewResponseTests(TestCase):
    def test_idempotency(self, m):
        review_response = ReviewResponseFactory.create()
        ReviewItemResponseFactory.create(
            review_item__review=review_response.review,
            processing_status=InternalStatus.succeeded,
        )

        process_review_response(review_response.pk)

        self.assertEqual(len(m.request_history), 0)

    def test_client_error_during_zaak_update(self, m):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/",
        )

        review_response = ReviewResponseFactory.create()
        zaak = ZaakFactory.create()
        review_item_response = ReviewItemResponseFactory.create(
            review_item__destruction_list_item__zaak=zaak.url,
            review_item__review=review_response.review,
            action_item=DestructionListItemAction.remove,
            action_zaak={"archiefactiedatum": "2026-01-01"},
        )

        m.patch(zaak.url, status_code=400)

        process_review_response(review_response.pk)

        review_response.refresh_from_db()
        review_item_response.refresh_from_db()

        self.assertEqual(review_response.processing_status, InternalStatus.failed)
        self.assertEqual(review_item_response.processing_status, InternalStatus.failed)

    def test_changes_to_both_zaak_and_destruction_list_item(self, m):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/",
        )

        review_response = ReviewResponseFactory.create(
            review__destruction_list__status=ListStatus.changes_requested,
            review__author__email="reviewer1@oab.nl",
        )
        zaak = ZaakFactory.create(archiefactiedatum="2025-01-01")
        review_item_response = ReviewItemResponseFactory.create(
            review_item__destruction_list_item__zaak=zaak.url,
            review_item__review=review_response.review,
            action_item=DestructionListItemAction.remove,
            action_zaak={"archiefactiedatum": "2026-01-01"},
        )
        review_response.review.destruction_list.assignees.all().delete()
        first_reviwer = DestructionListAssigneeFactory.create(
            user=review_response.review.author,
            destruction_list=review_response.review.destruction_list,
            role=ListRole.reviewer,
        )
        DestructionListAssigneeFactory.create(
            destruction_list=review_response.review.destruction_list,
            role=ListRole.reviewer,
        )

        m.patch(zaak.url, json={"archiefactiedatum": "2026-01-01"})

        with (
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_review_required="Destruction list review request",
                    body_review_required="Please review the list",
                ),
            ),
        ):
            process_review_response(review_response.pk)

        review_response.refresh_from_db()
        review_item_response.refresh_from_db()
        zaak.refresh_from_db()

        self.assertEqual(review_response.processing_status, InternalStatus.succeeded)
        self.assertEqual(
            review_item_response.processing_status, InternalStatus.succeeded
        )
        self.assertEqual(
            review_item_response.review_item.destruction_list_item.status,
            ListItemStatus.removed,
        )
        self.assertEqual(zaak.archiefactiedatum.isoformat(), "2026-01-01")
        self.assertEqual(
            review_response.review.destruction_list.assignee, first_reviwer.user
        )
        self.assertEqual(
            review_response.review.destruction_list.status, ListStatus.ready_to_review
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Destruction list review request")
        self.assertEqual(mail.outbox[0].recipients(), ["reviewer1@oab.nl"])


class ProcessDeletingZakenTests(TestCase):
    @log_capture(level=logging.INFO)
    def test_skips_if_already_succeeded(self, logs):
        destruction_list = DestructionListFactory.create(
            processing_status=InternalStatus.succeeded,
            status=ListStatus.ready_to_delete,
        )

        delete_destruction_list(destruction_list)

        self.assertEqual(
            (
                "openarchiefbeheer.destruction.tasks",
                "INFO",
                f"Destruction list {destruction_list.pk} has already successfully been processed. Skipping.",
            ),
            logs[0],
        )

    @log_capture(level=logging.WARNING)
    def test_aborts_if_not_ready_to_delete(self, logs):
        destruction_list = DestructionListFactory.create(
            name="Test", status=ListStatus.changes_requested
        )

        delete_destruction_list(destruction_list)

        self.assertEqual(
            (
                "openarchiefbeheer.destruction.tasks",
                "WARNING",
                "Cannot proceed with deleting list Test since it has status changes_requested.",
            ),
            logs[0],
        )

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_process_list(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete
        )
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        item1 = DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
        )
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        item2 = DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/222-222-222",
            destruction_list=destruction_list,
        )

        with patch(
            "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects"
        ) as m_delete:
            delete_destruction_list(destruction_list)

        destruction_list.refresh_from_db()
        item1.refresh_from_db()
        item2.refresh_from_db()

        m_delete.assert_called()

        calls_kwargs = [
            {
                "zaak": call.kwargs["zaak"].url,
                "result_store": call.kwargs["result_store"].store.pk,
            }
            for call in m_delete.call_args_list
        ]

        self.assertIn(
            {
                "zaak": "http://zaken.nl/api/v1/zaken/111-111-111",
                "result_store": item1.pk,
            },
            calls_kwargs,
        )
        self.assertIn(
            {
                "zaak": "http://zaken.nl/api/v1/zaken/222-222-222",
                "result_store": item2.pk,
            },
            calls_kwargs,
        )
        self.assertEqual(destruction_list.processing_status, InternalStatus.succeeded)
        self.assertEqual(destruction_list.status, ListStatus.deleted)
        self.assertEqual(item1.processing_status, InternalStatus.succeeded)
        self.assertEqual(item2.processing_status, InternalStatus.succeeded)

        self.assertFalse(
            Zaak.objects.filter(
                url__in=[
                    "http://zaken.nl/api/v1/zaken/111-111-111",
                    "http://zaken.nl/api/v1/zaken/222-222-222",
                ]
            ).exists()
        )

    @log_capture(level=logging.INFO)
    def test_item_skipped_if_already_succeeded(self, logs):
        item = DestructionListItemFactory.create(
            processing_status=InternalStatus.succeeded
        )

        delete_destruction_list_item(item.pk)

        self.assertEqual(
            (
                "openarchiefbeheer.destruction.tasks",
                "INFO",
                f"Item {item.pk} already successfully processed. Skipping.",
            ),
            logs[0],
        )

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_processing_list_with_failed_item(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete, processing_status=InternalStatus.failed
        )
        zaak = ZaakFactory.create()
        DestructionListItemFactory.create(
            zaak=zaak.url,
            destruction_list=destruction_list,
            processing_status=InternalStatus.failed,
            internal_results={"traceback": "Some traceback"},
        )

        with (
            patch(
                "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects",
            ),
        ):
            delete_destruction_list(destruction_list)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.processing_status, InternalStatus.succeeded)
        self.assertEqual(destruction_list.status, ListStatus.deleted)

        item = destruction_list.items.first()

        self.assertEqual(item.processing_status, InternalStatus.succeeded)
        self.assertEqual(
            item.internal_results,
            {"deleted_resources": {}, "resources_to_delete": {}, "traceback": ""},
        )

    def test_complete_and_notify(self):
        list = DestructionListFactory.create(
            processing_status=InternalStatus.processing,
            status=ListStatus.ready_to_delete,
        )
        assignees = DestructionListAssigneeFactory.create_batch(
            3, destruction_list=list
        )

        with (
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_successful_deletion="DELETED!",
                    body_successful_deletion="Wohoo deleted list",
                ),
            ),
        ):
            complete_and_notify(list.pk)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(
            sorted(mail.outbox[0].to),
            sorted([assignee.user.email for assignee in assignees]),
        )
        self.assertEqual(mail.outbox[0].subject, "DELETED!")

        list.refresh_from_db()

        self.assertEqual(list.status, ListStatus.deleted)
        self.assertEqual(list.processing_status, InternalStatus.succeeded)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_other_items_processed_if_one_fails(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete
        )
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        item1 = DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
        )
        ZaakFactory.create(
            url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        item2 = DestructionListItemFactory.create(
            zaak="http://zaken.nl/api/v1/zaken/222-222-222",
            destruction_list=destruction_list,
        )

        def mock_exceptions(zaak, result_store):
            if zaak.url == item1.zaak:
                raise Exception("An errur occurred!")

        with (
            patch(
                "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects",
                side_effect=mock_exceptions,
            ),
        ):
            delete_destruction_list(destruction_list)

        destruction_list.refresh_from_db()
        item1.refresh_from_db()
        item2.refresh_from_db()

        self.assertEqual(destruction_list.processing_status, InternalStatus.failed)
        self.assertEqual(destruction_list.status, ListStatus.ready_to_delete)
        self.assertEqual(item1.processing_status, InternalStatus.failed)
        self.assertEqual(item2.processing_status, InternalStatus.succeeded)
        self.assertTrue(Zaak.objects.filter(url=item1.zaak).exists())
        self.assertFalse(Zaak.objects.filter(url=item2.zaak).exists())

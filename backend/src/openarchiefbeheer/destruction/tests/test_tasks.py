import logging
from datetime import date
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings

from freezegun import freeze_time
from privates.test import temp_private_root
from requests_mock import Mocker
from testfixtures import log_capture
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
    ZaakActionType,
)
from ..tasks import (
    complete_and_notify,
    delete_destruction_list,
    delete_destruction_list_item,
    process_review_response,
    queue_destruction_lists_for_deletion,
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
            review_item__destruction_list_item__zaak=zaak,
            review_item__review=review_response.review,
            action_item=DestructionListItemAction.remove,
            action_zaak_type=ZaakActionType.bewaartermijn,
            action_zaak={
                "archiefactiedatum": "2026-01-01",
            },
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
            review_item__destruction_list_item__zaak=zaak,
            review_item__review=review_response.review,
            action_item=DestructionListItemAction.remove,
            action_zaak_type=ZaakActionType.bewaartermijn,
            action_zaak={
                "archiefactiedatum": "2026-01-01",
            },
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

    def test_reject_suggestion_does_not_change_zaak(self, m):
        review_response = ReviewResponseFactory.create(
            review__destruction_list__status=ListStatus.changes_requested,
            review__author__email="reviewer1@oab.nl",
        )
        zaak = ZaakFactory.create(archiefactiedatum="2025-01-01")
        review_item_response = ReviewItemResponseFactory.create(
            review_item__destruction_list_item__zaak=zaak,
            review_item__review=review_response.review,
            action_item=DestructionListItemAction.keep,
            action_zaak_type=ZaakActionType.bewaartermijn,
            action_zaak={
                "archiefactiedatum": "2026-01-01",
            },
        )
        review_response.review.destruction_list.assignees.all().delete()
        DestructionListAssigneeFactory.create(
            user=review_response.review.author,
            destruction_list=review_response.review.destruction_list,
            role=ListRole.reviewer,
        )

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
            ListItemStatus.suggested,
        )
        self.assertEqual(
            zaak.archiefactiedatum.isoformat(), "2025-01-01"
        )  # NOT changed!!


@temp_private_root()
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

        item1 = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            zaak__omschrijving="Test description 1",
            zaak__identificatie="ZAAK-01",
            zaak__startdatum=date(2020, 1, 1),
            zaak__einddatum=date(2022, 1, 1),
            zaak__resultaat="http://zaken.nl/api/v1/resultaten/111-111-111",
            destruction_list=destruction_list,
        )
        item2 = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/222-222-222",
            zaak__omschrijving="Test description 2",
            zaak__identificatie="ZAAK-02",
            zaak__startdatum=date(2020, 1, 2),
            zaak__einddatum=date(2022, 1, 2),
            zaak__resultaat="http://zaken.nl/api/v1/resultaten/111-111-222",
            destruction_list=destruction_list,
        )

        with (
            patch(
                "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects"
            ) as m_delete,
            patch(
                "openarchiefbeheer.destruction.utils.create_zaak_for_report"
            ) as m_zaak,
            patch(
                "openarchiefbeheer.destruction.utils.create_eio_destruction_report"
            ) as m_eio,
            patch("openarchiefbeheer.destruction.utils.attach_report_to_zaak") as m_zio,
        ):
            delete_destruction_list(destruction_list)

        destruction_list.refresh_from_db()
        item1.refresh_from_db()
        item2.refresh_from_db()

        m_delete.assert_called()

        calls_kwargs = [
            {
                "zaak_url": call.kwargs["zaak"].url,
                "result_store": call.kwargs["result_store"].store.pk,
            }
            for call in m_delete.call_args_list
        ]

        self.assertIn(
            {
                "zaak_url": "http://zaken.nl/api/v1/zaken/111-111-111",
                "result_store": item1.pk,
            },
            calls_kwargs,
        )
        self.assertIn(
            {
                "zaak_url": "http://zaken.nl/api/v1/zaken/222-222-222",
                "result_store": item2.pk,
            },
            calls_kwargs,
        )
        self.assertEqual(destruction_list.processing_status, InternalStatus.succeeded)
        self.assertEqual(destruction_list.status, ListStatus.deleted)
        self.assertEqual(item1.processing_status, InternalStatus.succeeded)
        self.assertEqual(item2.processing_status, InternalStatus.succeeded)
        self.assertEqual(item1._zaak_url, "")
        self.assertEqual(item2._zaak_url, "")

        self.assertFalse(
            Zaak.objects.filter(
                url__in=[
                    "http://zaken.nl/api/v1/zaken/111-111-111",
                    "http://zaken.nl/api/v1/zaken/222-222-222",
                ]
            ).exists()
        )

        lines = [line for line in destruction_list.destruction_report.readlines()]

        self.assertEqual(len(lines), 3)
        self.assertEqual(
            lines[1],
            b"http://zaken.nl/api/v1/zaken/111-111-111,2022-01-01,http://zaken.nl/api/v1/resultaten/111-111-111,2020-01-01,Test description 1,ZAAK-01,http://catalogue-api.nl/zaaktypen/111-111-111,Aangifte behandelen,1\n",
        )
        self.assertEqual(
            lines[2],
            b"http://zaken.nl/api/v1/zaken/222-222-222,2022-01-02,http://zaken.nl/api/v1/resultaten/111-111-222,2020-01-02,Test description 2,ZAAK-02,http://catalogue-api.nl/zaaktypen/111-111-111,Aangifte behandelen,1\n",
        )

        m_zaak.assert_called()
        m_eio.assert_called()
        m_zio.assert_called()

        self.assertEqual(item1.extra_zaak_data, {})
        self.assertEqual(item2.extra_zaak_data, {})

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

        DestructionListItemFactory.create(
            with_zaak=True,
            destruction_list=destruction_list,
            processing_status=InternalStatus.failed,
            internal_results={"traceback": "Some traceback"},
        )

        with (
            patch(
                "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects",
            ),
            patch(
                "openarchiefbeheer.destruction.utils.create_zaak_for_report"
            ) as m_zaak,
            patch(
                "openarchiefbeheer.destruction.utils.create_eio_destruction_report"
            ) as m_eio,
            patch("openarchiefbeheer.destruction.utils.attach_report_to_zaak") as m_zio,
        ):
            delete_destruction_list(destruction_list)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.processing_status, InternalStatus.succeeded)
        self.assertEqual(destruction_list.status, ListStatus.deleted)

        item = destruction_list.items.first()

        self.assertEqual(item.processing_status, InternalStatus.succeeded)
        self.assertEqual(
            item.internal_results,
            {
                "deleted_resources": {},
                "resources_to_delete": {},
                "traceback": "",
                "created_resources": {},
            },
        )

        m_zaak.assert_called()
        m_eio.assert_called()
        m_zio.assert_called()

    def test_complete_and_notify(self):
        destruction_list = DestructionListFactory.create(
            name="Some destruction list",
            processing_status=InternalStatus.processing,
            status=ListStatus.ready_to_delete,
        )
        DestructionListItemFactory.create(
            processing_status=InternalStatus.succeeded,
            destruction_list=destruction_list,
            extra_zaak_data={
                "url": "http://zaken.nl/api/v1/zaken/111-111-111",
                "omschrijving": "Test description 1",
                "identificatie": "ZAAK-01",
                "startdatum": "2020-01-01",
                "einddatum": "2022-01-01",
                "resultaat": "http://zaken.nl/api/v1/resultaten/111-111-111",
                "zaaktype": {
                    "url": "http://catalogi.nl/api/v1/zaaktypen/111-111-111",
                    "omschrijving": "Tralala zaaktype",
                    "selectielijst_procestype": {
                        "nummer": 1,
                    },
                },
            },
        )
        assignees = DestructionListAssigneeFactory.create_batch(
            3, destruction_list=destruction_list
        )

        self.assertIsNone(destruction_list.destruction_report.name)

        with (
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_successful_deletion="DELETED!",
                    body_successful_deletion="Wohoo deleted list",
                ),
            ),
            patch("openarchiefbeheer.destruction.utils.create_zaak_for_report"),
            patch("openarchiefbeheer.destruction.utils.create_eio_destruction_report"),
            patch("openarchiefbeheer.destruction.utils.attach_report_to_zaak"),
            freeze_time("2024-10-09"),
        ):
            complete_and_notify(destruction_list.pk)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(
            sorted(mail.outbox[0].to),
            sorted([assignee.user.email for assignee in assignees]),
        )
        self.assertEqual(mail.outbox[0].subject, "DELETED!")

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.deleted)
        self.assertEqual(destruction_list.processing_status, InternalStatus.succeeded)
        self.assertEqual(
            destruction_list.destruction_report.name,
            "destruction_reports/2024/10/09/report_some-destruction-list.csv",
        )

        lines = [line for line in destruction_list.destruction_report.readlines()]

        self.assertEqual(len(lines), 2)
        self.assertEqual(
            lines[0],
            b"url,einddatum,resultaat,startdatum,omschrijving,identificatie,zaaktype url,zaaktype omschrijving,selectielijst procestype nummer\n",
        )
        self.assertEqual(
            lines[1],
            b"http://zaken.nl/api/v1/zaken/111-111-111,2022-01-01,http://zaken.nl/api/v1/resultaten/111-111-111,2020-01-01,Test description 1,ZAAK-01,http://catalogi.nl/api/v1/zaaktypen/111-111-111,Tralala zaaktype,1\n",
        )

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_other_items_processed_if_one_fails(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete
        )

        item1 = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
        )
        item2 = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/222-222-222",
            destruction_list=destruction_list,
        )

        def mock_exceptions(zaak, result_store):
            if zaak.url == item1.zaak.url:
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
        self.assertTrue(
            Zaak.objects.filter(url="http://zaken.nl/api/v1/zaken/111-111-111").exists()
        )
        self.assertFalse(
            Zaak.objects.filter(url="http://zaken.nl/api/v1/zaken/222-222-222").exists()
        )

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_deleting_list_with_zaken_archiefactiedatum_in_the_future(self):
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
            zaak__url="http://zaak-test.nl/zaken/111-111-111",
            destruction_list=destruction_list,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__archiefactiedatum=date(2023, 1, 1),
            destruction_list=destruction_list,
        )

        with (
            freeze_time("2024-01-01T21:36:00+02:00"),
            patch(
                "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects",
            ),
        ):
            delete_destruction_list(destruction_list)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.processing_status, InternalStatus.failed)
        self.assertEqual(destruction_list.status, ListStatus.ready_to_delete)

        items = destruction_list.items.all().order_by("pk")

        self.assertEqual(items[0].processing_status, InternalStatus.failed)
        self.assertEqual(items[1].processing_status, InternalStatus.succeeded)
        self.assertEqual(items[0]._zaak_url, "http://zaak-test.nl/zaken/111-111-111")
        self.assertEqual(items[1]._zaak_url, "")

    def test_queuing_lists_to_delete(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.new,
            planned_destruction_date=date(2023, 1, 1),
        )
        DestructionListFactory.create(
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.failed,  # Not new
            planned_destruction_date=date(2023, 1, 1),
        )
        DestructionListFactory.create(
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.queued,  # Not new
            planned_destruction_date=date(2023, 1, 1),
        )
        DestructionListFactory.create(
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.new,
            planned_destruction_date=date(2025, 1, 1),  # In the future
        )
        DestructionListFactory.create(
            status=ListStatus.ready_to_review,  # Not ready to delete
            processing_status=InternalStatus.new,
            planned_destruction_date=date(2023, 1, 1),
        )

        with (
            freeze_time("2024-01-01T12:00:00+01:00"),
            patch("openarchiefbeheer.destruction.tasks.delete_destruction_list") as m,
        ):
            queue_destruction_lists_for_deletion()

        m.assert_called_once_with(destruction_list)

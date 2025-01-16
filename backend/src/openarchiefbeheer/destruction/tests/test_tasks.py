import logging
from datetime import date
from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings, tag
from django.utils import timezone
from django.utils.translation import gettext as _, ngettext

from freezegun import freeze_time
from privates.test import temp_private_root
from requests import HTTPError
from requests_mock import Mocker
from testfixtures import log_capture
from timeline_logger.models import TimelineLog
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.logging import logevent
from openarchiefbeheer.selection.models import SelectionItem
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
    ZaakActionType,
)
from ..tasks import (
    complete_and_notify,
    delete_destruction_list,
    delete_destruction_list_item,
    process_review_response,
    queue_destruction_lists_for_deletion,
)
from ..utils import get_selection_key_for_review
from .factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
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
            role=ListRole.main_reviewer,
        )
        DestructionListAssigneeFactory.create(
            destruction_list=review_response.review.destruction_list,
            role=ListRole.main_reviewer,
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
            review_item__destruction_list_item__destruction_list=review_response.review.destruction_list,
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
            role=ListRole.main_reviewer,
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

        logs = TimelineLog.objects.for_object(review_response.review.destruction_list)

        self.assertEqual(logs.count(), 1)

        message = logs[0].get_message()

        self.assertIn(
            _(
                'The review response of destruction list "%(list_name)s" has been processed.'
            )
            % {"list_name": review_response.review.destruction_list.name},
            message,
        )
        self.assertIn(_("There is now one zaak on the list."), message)

    def test_prepopulating_selection(self, m):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.changes_requested
        )
        reviewer = DestructionListAssigneeFactory.create(
            destruction_list=destruction_list, post__can_review_destruction=True
        )
        items = DestructionListItemFactory.create_batch(
            3, destruction_list=destruction_list, with_zaak=True
        )

        review = DestructionListReviewFactory.create(
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
            author=reviewer.user,
        )
        review_item1 = DestructionListItemReviewFactory.create(
            destruction_list=destruction_list,
            review=review,
            destruction_list_item=items[0],
        )
        review_item2 = DestructionListItemReviewFactory.create(
            destruction_list=destruction_list,
            review=review,
            destruction_list_item=items[1],
        )

        review_response = ReviewResponseFactory.create(review=review)
        # Reviewer suggestion on zaak1 ignored
        ReviewItemResponseFactory.create(
            review_item=review_item1,
            action_item=DestructionListItemAction.keep,
        )
        # Reviewer suggestion implemented, zaak2 is removed from the list
        ReviewItemResponseFactory.create(
            review_item=review_item2,
            action_item=DestructionListItemAction.remove,
            action_zaak_type=ZaakActionType.bewaartermijn,
            action_zaak={
                "archiefactiedatum": "2026-01-01",
            },
        )
        # The third zaak was accepted

        # Now we process the review and we expect the selection to contain zaak1 NOT selected and zaak3 selected.
        # Zaak2 should not be present because it was removed from the list
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/",
        )
        m.patch(items[1].zaak.url, json={"archiefactiedatum": "2026-01-01"})
        process_review_response(review_response.pk)

        selection_key = get_selection_key_for_review(destruction_list, "review")

        selection_items = SelectionItem.objects.filter(key=selection_key).order_by(
            "selection_data__selected"
        )

        self.assertEqual(selection_items.count(), 2)
        self.assertEqual(selection_items[0].zaak_url, items[0].zaak.url)
        self.assertEqual(selection_items[1].zaak_url, items[2].zaak.url)

        # This is the zaak which the reviewer already had approved (zaak3)
        self.assertTrue(selection_items[1].selection_data["detail"]["approved"])
        self.assertTrue(selection_items[1].selection_data["selected"])

        # This is the zaak for which the feedback was ignored (zaak1)
        self.assertNotIn("detail", selection_items[0].selection_data)
        self.assertFalse(selection_items[0].selection_data["selected"])

        logs = TimelineLog.objects.for_object(destruction_list)

        self.assertEqual(logs.count(), 1)

        message = logs[0].get_message()

        self.assertIn(
            _(
                'The review response of destruction list "%(list_name)s" has been processed.'
            )
            % {"list_name": review_response.review.destruction_list.name},
            message,
        )
        self.assertIn(
            ngettext(
                "There is now one zaak on the list.",
                "There are now %(number_of_zaken)s zaken on the list.",
                2,
            )
            % {"number_of_zaken": 2},
            message,
        )


@temp_private_root()
class ProcessDeletingZakenTests(TestCase):
    def setUp(self):
        super().setUp()

        self.addCleanup(cache.clear)

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
        record_manager = UserFactory.create(
            first_name="John",
            last_name="Doe",
            username="jdoe1",
            post__can_start_destruction=True,
        )
        ServiceFactory.create(
            api_root="http://zaken.nl/api/v1", label="Open Zaak - Zaken API"
        )
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete, author=record_manager
        )
        review = DestructionListReviewFactory.create(
            destruction_list=destruction_list, decision=ReviewDecisionChoices.accepted
        )

        with freeze_time("2024-10-06T12:00:00+02:00"):
            logevent.destruction_list_reviewed(destruction_list, review, review.author)
        with freeze_time("2024-12-01T12:00:00+01:00"):
            logevent.destruction_list_deletion_triggered(
                destruction_list, record_manager
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
            status=ListItemStatus.suggested,
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
            status=ListItemStatus.suggested,
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
            freeze_time("2024-12-02T12:00:00+01:00"),
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

        m_zaak.assert_called()
        m_eio.assert_called()
        m_zio.assert_called()

        self.assertEqual(item1.extra_zaak_data, {})
        self.assertEqual(item2.extra_zaak_data, {})
        with self.assertRaises(ValueError):
            destruction_list.destruction_report.file

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
        author = UserFactory.create(post__can_start_destruction=True)
        ServiceFactory.create(
            api_root="http://zaak-test.nl/api/v1", label="Open Zaak - Zaken API"
        )
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete,
            processing_status=InternalStatus.failed,
            author=author,
        )
        logevent.destruction_list_deletion_triggered(destruction_list, author)

        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaak-test.nl/api/v1/zaken/111-111-111",
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
        record_manager = UserFactory.create(
            first_name="John",
            last_name="Doe",
            username="jdoe1",
            post__can_start_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            name="Some destruction list",
            processing_status=InternalStatus.processing,
            status=ListStatus.ready_to_delete,
            author=record_manager,
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
                "resultaat": {
                    "url": "http://zaken.nl/api/v1/resultaten/111-111-111",
                    "resultaattype": {
                        "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                        "archiefactietermijn": "P1D",
                        "omschrijving": "Resulttype 0",
                    },
                },
                "zaaktype": {
                    "uuid": "111-111-111",
                    "url": "http://catalogi.nl/api/v1/zaaktypen/111-111-111",
                    "omschrijving": "Tralala zaaktype",
                    "selectielijst_procestype": {
                        "nummer": 1,
                        "url": "https://selectielijst.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                        "naam": "Evaluatie uitvoeren",
                        "jaar": 2000,
                    },
                },
            },
        )
        review = DestructionListReviewFactory.create(
            destruction_list=destruction_list, decision=ReviewDecisionChoices.accepted
        )
        assignees = DestructionListAssigneeFactory.create_batch(
            3, destruction_list=destruction_list
        )

        self.assertIsNone(destruction_list.destruction_report.name)
        with freeze_time("2024-10-06T12:00:00+02:00"):
            logevent.destruction_list_reviewed(destruction_list, review, review.author)
        with freeze_time("2024-10-08T12:00:00+02:00"):
            logevent.destruction_list_deletion_triggered(
                destruction_list, record_manager
            )

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
            freeze_time("2024-10-09T12:00:00+02:00"),
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
            destruction_list.end.astimezone(
                tz=timezone.get_default_timezone()
            ).isoformat(),
            "2024-10-09T12:00:00+02:00",
        )
        with self.assertRaises(ValueError):
            destruction_list.destruction_report.file

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

        ServiceFactory.create(
            api_root="http://zaak-test.nl/api/v1", label="Open Zaak - Zaken API"
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__archiefactiedatum=date(2025, 1, 1),
            zaak__url="http://zaak-test.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__archiefactiedatum=date(2023, 1, 1),
            zaak__url="http://zaak-test.nl/api/v1/zaken/222-222-222",
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
        self.assertEqual(
            items[0]._zaak_url, "http://zaak-test.nl/api/v1/zaken/111-111-111"
        )
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

    @tag("gh-473")
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_traceback_from_failure_is_saved(self):
        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )
        ServiceFactory.create(
            api_root="http://zaak-test.nl/api/v1", label="Open Zaak - Zaken API"
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.ready_to_delete,
        )
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__archiefactiedatum=date(2023, 1, 1),
            zaak__url="http://zaak-test.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
        )

        with (
            freeze_time("2024-01-01T21:36:00+02:00"),
            patch(
                "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects",
                side_effect=HTTPError,
            ),
        ):
            delete_destruction_list(destruction_list)

        item.refresh_from_db()

        self.assertNotEqual(item.internal_results["traceback"], "")
        self.assertIn("HTTPError", item.internal_results["traceback"])

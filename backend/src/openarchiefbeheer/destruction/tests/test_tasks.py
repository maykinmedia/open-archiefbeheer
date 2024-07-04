from unittest.mock import patch

from django.core import mail
from django.test import TestCase

from requests_mock import Mocker
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
)
from ..tasks import process_review_response
from .factories import (
    DestructionListAssigneeFactory,
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
            review__destruction_list__status=ListStatus.changes_requested
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
            user__email="reviewer1@oab.nl",
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

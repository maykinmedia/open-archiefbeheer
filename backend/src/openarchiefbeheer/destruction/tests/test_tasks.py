import re

from django.test import TestCase

from requests_mock import Mocker
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import DestructionListItemAction, InternalStatus, ListItemStatus
from ..tasks import process_review_response
from .factories import ReviewItemResponseFactory, ReviewResponseFactory


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

    def test_number_of_queries(self, m):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://zaken-api.nl/",
        )

        review_response = ReviewResponseFactory.create()
        zaken = ZaakFactory.create_batch(2)
        ReviewItemResponseFactory.create(
            review_item__destruction_list_item__zaak=zaken[0].url,
            review_item__review=review_response.review,
            action_item=DestructionListItemAction.remove,
            action_zaak={"archiefactiedatum": "2026-01-01"},
        )
        ReviewItemResponseFactory.create(
            review_item__destruction_list_item__zaak=zaken[1].url,
            review_item__review=review_response.review,
            action_item=DestructionListItemAction.remove,
            action_zaak={"archiefactiedatum": "2026-01-01"},
        )

        matcher = re.compile(r"http:\/\/zaken-api.nl\/zaken\/[0-9a-z\-]+?")
        m.patch(matcher, json={"archiefactiedatum": "2026-01-01"})

        # 1 - Get review response
        # 2 - Get review item responses and lock for udate
        # 3 - Set status of first review item response to "processing"
        # 4 - Update first destruction list item
        # 5 - Get Zaak
        # 6 - Get ZGW service to update zaak
        # 7 - Update first zaak
        # 8 - Set status of first review item response to "succeeded"
        # 9, 10, 11, 12, 13, 14 - same as 3-8 but for second review item response
        with self.assertNumQueries(14):
            process_review_response(review_response.pk)

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

        review_response = ReviewResponseFactory.create()
        zaak = ZaakFactory.create(archiefactiedatum="2025-01-01")
        review_item_response = ReviewItemResponseFactory.create(
            review_item__destruction_list_item__zaak=zaak.url,
            review_item__review=review_response.review,
            action_item=DestructionListItemAction.remove,
            action_zaak={"archiefactiedatum": "2026-01-01"},
        )

        m.patch(zaak.url, json={"archiefactiedatum": "2026-01-01"})

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

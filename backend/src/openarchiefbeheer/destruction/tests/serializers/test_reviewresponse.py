from unittest.mock import patch

from django.test import TestCase
from django.utils.translation import gettext_lazy as _

from requests.exceptions import HTTPError
from rest_framework.test import APIRequestFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...api.serializers import ReviewResponseSerializer
from ...constants import DestructionListItemAction, ListStatus, ZaakActionType
from ..factories import DestructionListItemReviewFactory, DestructionListReviewFactory

factory = APIRequestFactory()


class ReviewResponseSerializerTests(TestCase):
    def test_rejecting_suggestion_cannot_have_zaak_action(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager,
        )
        items_review = DestructionListItemReviewFactory.create(
            destruction_list_item__destruction_list=review.destruction_list,
            review=review,
        )

        data = {
            "review": review.pk,
            "comment": "A response about the review.",
            "items_responses": [
                {
                    "review_item": items_review.pk,
                    "action_item": DestructionListItemAction.keep,
                    "action_zaak_type": ZaakActionType.bewaartermijn,
                    "action_zaak": {
                        "archiefactiedatum": "2030-01-01",
                    },
                    "comment": "This zaak needs to stay in the list.",
                },
            ],
        }

        serializer = ReviewResponseSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["items_responses"][0]["action_zaak"][0],
            _("The case cannot be changed if it is kept in the destruction list."),
        )

    def test_bewaartermijn_zaak_action_cannot_change_selectielijst(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager,
        )
        items_review = DestructionListItemReviewFactory.create(
            destruction_list_item__destruction_list=review.destruction_list,
            review=review,
        )

        data = {
            "review": review.pk,
            "comment": "A response about the review.",
            "items_responses": [
                {
                    "review_item": items_review.pk,
                    "action_item": DestructionListItemAction.remove,
                    "action_zaak_type": ZaakActionType.bewaartermijn,
                    "action_zaak": {
                        "selectielijstklasse": "http://some-url.nl",
                        "archiefactiedatum": "2030-01-01",
                    },
                    "comment": "This zaak needs to kept longer.",
                },
            ],
        }

        serializer = ReviewResponseSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["items_responses"][0]["action_zaak_type"][0],
            _(
                "The selectielijstklasse cannot be changed if the case action type is 'bewaartermijn'."
            ),
        )

    def test_selectielijst_zaak_action_requires_selectielijst(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager,
        )
        items_review = DestructionListItemReviewFactory.create(
            destruction_list_item__destruction_list=review.destruction_list,
            review=review,
        )

        data = {
            "review": review.pk,
            "comment": "A response about the review.",
            "items_responses": [
                {
                    "review_item": items_review.pk,
                    "action_item": DestructionListItemAction.remove,
                    "action_zaak_type": ZaakActionType.selectielijstklasse_and_bewaartermijn,
                    "action_zaak": {  # No selectielijstklasse
                        "archiefactiedatum": "2030-01-01",
                    },
                    "comment": "This zaak needs to kept longer.",
                },
            ],
        }

        serializer = ReviewResponseSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["items_responses"][0]["selectielijstklasse"][0],
            _(
                "The selectielijstklasse is required for action type is 'selectielijstklasse_and_bewaartermijn'."
            ),
        )

    def test_update_archiefactiedatum_selectielijst_api_error(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager,
        )
        items_review = DestructionListItemReviewFactory.create(
            destruction_list_item__with_zaak=True,
            destruction_list_item__zaak__selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/8320ab7d-3a8d-4c8b-b94a-14b4fa374d0a",
            destruction_list_item__destruction_list=review.destruction_list,
            review=review,
        )

        data = {
            "review": review.pk,
            "comment": "A response about the review.",
            "items_responses": [
                {
                    "review_item": items_review.pk,
                    "action_item": DestructionListItemAction.remove,
                    "action_zaak_type": ZaakActionType.bewaartermijn,
                    "action_zaak": {
                        "archiefactiedatum": "2030-01-01",
                    },
                    "comment": "This zaak needs to kept.",
                },
            ],
        }

        request = factory.get("/foo")
        request.user = record_manager

        with patch(
            "openarchiefbeheer.destruction.api.serializers.retrieve_selectielijstklasse_resultaat",
            side_effect=HTTPError,
        ):
            serializer = ReviewResponseSerializer(
                data=data, context={"request": request}
            )

            self.assertFalse(serializer.is_valid())

        self.assertEqual(
            serializer.errors["items_responses"][0]["non_field_errors"][0],
            _(
                "Could not validate the selectielijstklasse waardering due to an unexpected response from the Selectielijst API."
            ),
        )

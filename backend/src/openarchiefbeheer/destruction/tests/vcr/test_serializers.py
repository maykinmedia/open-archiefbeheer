from unittest.mock import patch

from django.test import TestCase, tag
from django.utils.translation import gettext_lazy as _

from rest_framework.test import APIRequestFactory
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.models import APIConfig

from ...api.serializers import ReviewResponseSerializer
from ...constants import DestructionListItemAction, ListStatus, ZaakActionType
from ..factories import DestructionListItemReviewFactory, DestructionListReviewFactory

factory = APIRequestFactory()


@tag("vcr")
class ReviewResponseSerializerTest(VCRMixin, TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.config = ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1",
        )

    def test_new_selectielijst_blijvend_bewaren(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
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
                    "action_zaak": {
                        "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/8320ab7d-3a8d-4c8b-b94a-14b4fa374d0a",
                        "archiefactiedatum": "2030-01-01",
                    },
                    "comment": "This zaak needs to kept.",
                },
            ],
        }

        with patch(
            "openarchiefbeheer.zaken.utils.APIConfig.get_solo",
            return_value=APIConfig(selectielijst_api_service=self.config),
        ):
            serializer = ReviewResponseSerializer(data=data)

            self.assertFalse(serializer.is_valid())

        self.assertEqual(
            serializer.errors["items_responses"][0]["selectielijstklasse"][0],
            _(
                "The selectielijstklasse has waardering 'blijvend_bewaren', so the archiefactiedatum should be null."
            ),
        )

    def test_selectielijst_blijvend_bewaren_update_archiefactiedatum(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
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
            "openarchiefbeheer.zaken.utils.APIConfig.get_solo",
            return_value=APIConfig(selectielijst_api_service=self.config),
        ):
            serializer = ReviewResponseSerializer(
                data=data, context={"request": request}
            )

            self.assertFalse(serializer.is_valid())

        self.assertEqual(
            serializer.errors["items_responses"][0]["archiefactiedatum"][0],
            _(
                "The selectielijstklasse has waardering 'blijvend_bewaren', so an archiefactiedatum cannot be set."
            ),
        )

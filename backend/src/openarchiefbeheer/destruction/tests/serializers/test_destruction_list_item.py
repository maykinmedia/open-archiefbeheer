from django.test import TestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...api.serializers import DestructionListItemReadSerializer
from ...constants import DestructionListItemAction, ListStatus
from ..factories import (
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
    ReviewItemResponseFactory,
)


class TestDestructionListItemSerializer(TestCase):
    def test_ignored_review_advice(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.ready_to_review,
        )
        item_reviews = DestructionListItemReviewFactory.create_batch(
            3,
            destruction_list_item__destruction_list=review.destruction_list,
            review=review,
        )
        ReviewItemResponseFactory.create(
            review_item=item_reviews[1],
            review_item__review=review,
            action_item=DestructionListItemAction.keep,
        )
        ReviewItemResponseFactory.create(
            review_item=item_reviews[2],
            review_item__review=review,
            action_item=DestructionListItemAction.remove,
        )

        with self.subTest("Accepted item"):
            serialiser = DestructionListItemReadSerializer(
                instance=item_reviews[0].destruction_list_item
            )

            self.assertIsNone(serialiser.data["review_advice_ignored"])

        with self.subTest("Item with ignored feedback"):
            serialiser = DestructionListItemReadSerializer(
                instance=item_reviews[1].destruction_list_item
            )

            self.assertTrue(serialiser.data["review_advice_ignored"])

        with self.subTest("Item with accepted feedback"):
            serialiser = DestructionListItemReadSerializer(
                instance=item_reviews[2].destruction_list_item
            )

            self.assertFalse(serialiser.data["review_advice_ignored"])

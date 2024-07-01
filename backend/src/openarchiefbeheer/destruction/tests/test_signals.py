from unittest.mock import patch

from django.core import mail
from django.test import TestCase

from openarchiefbeheer.emails.models import EmailConfig

from ..constants import ReviewDecisionChoices
from .factories import DestructionListReviewFactory


class SignalsTests(TestCase):
    @patch(
        "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
        return_value=EmailConfig(
            subject_changes_requested="Changes requested",
            body_changes_requested="Changes requested",
        ),
    )
    def test_no_email_sent_if_not_review_created(self, m):
        review = DestructionListReviewFactory.create(
            decision=ReviewDecisionChoices.rejected,
            destruction_list__author__email="record_manager@oab.nl",
        )

        self.assertEqual(len(mail.outbox), 1)

        review.comment = "Tralala some change"
        review.save()

        # No extra email sent on update event
        self.assertEqual(len(mail.outbox), 1)

from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings

from openarchiefbeheer.destruction.tasks import delete_destruction_list
from openarchiefbeheer.emails.models import EmailConfig

from ..constants import ListStatus, ReviewDecisionChoices
from .factories import (
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListReviewFactory,
)


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

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_failure_during_deletion_sends_signal(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_delete, author__email="aaa@aaa.aaa"
        )
        DestructionListItemFactory.create_batch(2, destruction_list=destruction_list)

        with (
            patch(
                "openarchiefbeheer.destruction.models.delete_zaak_and_related_objects",
                side_effect=Exception,
            ),
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_error_during_deletion="FAILURE!!",
                    body_error_during_deletion="ERROR AAAh!",
                ),
            ),
            self.assertRaises(Exception),
        ):
            delete_destruction_list(destruction_list)

        self.assertEqual(len(mail.outbox), 1)

        email = mail.outbox[0]

        self.assertEqual(email.subject, "FAILURE!!")
        self.assertEqual(email.body, "ERROR AAAh!")
        self.assertEqual(email.to[0], "aaa@aaa.aaa")

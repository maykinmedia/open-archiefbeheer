from unittest.mock import patch

from django.test import TestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.models import ArchiveConfig

from ..constants import ListRole, ListStatus, ReviewDecisionChoices
from .factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListReviewFactory,
    ReviewResponseFactory,
)


class AssignementLogicTest(TestCase):
    def test_assign_first_reviewer(self):
        destruction_list = DestructionListFactory.create(status=ListStatus.new)
        assignees = DestructionListAssigneeFactory.create_batch(
            2, role=ListRole.reviewer, destruction_list=destruction_list
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_review)
        self.assertEqual(destruction_list.assignee, assignees[0].user)

    def test_assign_second_reviewer(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        assignees = DestructionListAssigneeFactory.create_batch(
            3, role=ListRole.reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=assignees[0].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_review)
        self.assertEqual(destruction_list.assignee, assignees[1].user)

    def test_reviewer_rejected_list(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        record_manager = DestructionListAssigneeFactory.create(
            role=ListRole.author,
            destruction_list=destruction_list,
            user=destruction_list.author,
        )
        reviewers = DestructionListAssigneeFactory.create_batch(
            2, role=ListRole.reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=reviewers[0].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )
        DestructionListReviewFactory.create(
            author=reviewers[1].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.changes_requested)
        self.assertEqual(destruction_list.assignee, record_manager.user)

    def test_all_reviewers_approved_long_process(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list, with_zaak=True
        )
        record_manager = DestructionListAssigneeFactory.create(
            role=ListRole.author,
            destruction_list=destruction_list,
            user=destruction_list.author,
        )
        reviewers = DestructionListAssigneeFactory.create_batch(
            2, role=ListRole.reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=reviewers[0].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )
        DestructionListReviewFactory.create(
            author=reviewers[1].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.internally_reviewed)
        self.assertEqual(destruction_list.assignee, record_manager.user)

    def test_all_reviewers_approved_short_process(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        item = DestructionListItemFactory.create(
            destruction_list=destruction_list, with_zaak=True
        )
        record_manager = DestructionListAssigneeFactory.create(
            role=ListRole.author,
            destruction_list=destruction_list,
            user=destruction_list.author,
        )
        reviewers = DestructionListAssigneeFactory.create_batch(
            2, role=ListRole.reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=reviewers[0].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )
        DestructionListReviewFactory.create(
            author=reviewers[1].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )

        with patch(
            "openarchiefbeheer.destruction.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(zaaktypes_short_process=[item.zaak.zaaktype]),
        ):
            destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_delete)
        self.assertEqual(destruction_list.assignee, record_manager.user)

    def test_assign_reviewer_after_processing_changes(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.changes_requested
        )
        reviewers = DestructionListAssigneeFactory.create_batch(
            2, role=ListRole.reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=reviewers[0].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )
        DestructionListReviewFactory.create(
            author=reviewers[1].user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_review)
        self.assertEqual(destruction_list.assignee, reviewers[1].user)

    def test_assign_archivist(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.internally_reviewed
        )
        archivist = DestructionListAssigneeFactory.create(
            role=ListRole.archivist, destruction_list=destruction_list
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_for_archivist)
        self.assertEqual(destruction_list.assignee, archivist.user)

    def test_archivist_accepts(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        record_manager = DestructionListAssigneeFactory.create(
            role=ListRole.author,
            destruction_list=destruction_list,
            user=destruction_list.author,
        )
        archivist = DestructionListAssigneeFactory.create(
            role=ListRole.archivist, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=archivist.user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_delete)
        self.assertEqual(destruction_list.assignee, record_manager.user)

    def test_reassign_reviewers_ready_to_review(self):
        reviewer_old = UserFactory.create(role__can_review_destruction=True)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review, assignee=reviewer_old
        )
        assignees = DestructionListAssigneeFactory.create_batch(
            2, role=ListRole.reviewer, destruction_list=destruction_list
        )

        destruction_list.reassign()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_review)
        self.assertEqual(destruction_list.assignee, assignees[0].user)

    def test_reassign_reviewers_noop(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.new, assignee=record_manager, author=record_manager
        )
        DestructionListAssigneeFactory.create_batch(
            2, role=ListRole.reviewer, destruction_list=destruction_list
        )

        with self.subTest("New"):
            destruction_list.reassign()

            destruction_list.refresh_from_db()

            self.assertEqual(destruction_list.status, ListStatus.new)
            self.assertEqual(destruction_list.assignee, record_manager)

        with self.subTest("Changes requested"):
            destruction_list.status = ListStatus.changes_requested
            destruction_list.save()

            destruction_list.reassign()

            destruction_list.refresh_from_db()

            self.assertEqual(destruction_list.status, ListStatus.changes_requested)
            self.assertEqual(destruction_list.assignee, record_manager)

        with self.subTest("Internally reviewed"):
            destruction_list.status = ListStatus.internally_reviewed
            destruction_list.save()

            destruction_list.reassign()

            destruction_list.refresh_from_db()

            self.assertEqual(destruction_list.status, ListStatus.internally_reviewed)
            self.assertEqual(destruction_list.assignee, record_manager)

    def test_archivist_requested_changes(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_for_archivist
        )
        record_manager = DestructionListAssigneeFactory.create(
            role=ListRole.author,
            destruction_list=destruction_list,
            user=destruction_list.author,
        )
        archivist = DestructionListAssigneeFactory.create(
            role=ListRole.archivist, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=archivist.user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.changes_requested)
        self.assertEqual(destruction_list.assignee, record_manager.user)

    def test_record_manager_processed_changes_after_archivist(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.changes_requested
        )
        archivist = DestructionListAssigneeFactory.create(
            role=ListRole.archivist, destruction_list=destruction_list
        )
        review = DestructionListReviewFactory.create(
            author=archivist.user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
        )
        ReviewResponseFactory.create(review=review)

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_for_archivist)
        self.assertEqual(destruction_list.assignee, archivist.user)

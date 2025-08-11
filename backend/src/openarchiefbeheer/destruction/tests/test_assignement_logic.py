from unittest.mock import patch

from django.test import TestCase, tag

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
    def test_assign_reviewer(self):
        destruction_list = DestructionListFactory.create(status=ListStatus.new)
        assignee = DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer, destruction_list=destruction_list
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_review)
        self.assertEqual(destruction_list.assignee, assignee.user)

    def test_reviewer_rejected_list(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )
        record_manager = DestructionListAssigneeFactory.create(
            role=ListRole.author,
            destruction_list=destruction_list,
            user=destruction_list.author,
        )
        reviewer = DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=reviewer.user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.changes_requested)
        self.assertEqual(destruction_list.assignee, record_manager.user)

    def test_reviewer_approved_long_process(self):
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
        reviewer = DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=reviewer.user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.internally_reviewed)
        self.assertEqual(destruction_list.assignee, record_manager.user)

    def test_reviewer_approved_short_process(self):
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
        reviewer = DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=reviewer.user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )

        with patch(
            "openarchiefbeheer.destruction.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(
                zaaktypes_short_process=[item.zaak._expand["zaaktype"]["identificatie"]]
            ),
        ):
            destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_delete)
        self.assertEqual(destruction_list.assignee, record_manager.user)

    def test_assign_reviewer_after_processing_changes(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.changes_requested
        )
        reviewer = DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer, destruction_list=destruction_list
        )
        DestructionListReviewFactory.create(
            author=reviewer.user,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_review)
        self.assertEqual(destruction_list.assignee, reviewer.user)

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

    def test_reassign_reviewer_ready_to_review(self):
        reviewer_old = UserFactory.create(post__can_review_destruction=True)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review, assignee=reviewer_old
        )
        assignee_new = DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer, destruction_list=destruction_list
        )

        destruction_list.reassign()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_review)
        self.assertEqual(destruction_list.assignee, assignee_new.user)

    def test_reassign_reviewer_noop(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.new, assignee=record_manager, author=record_manager
        )
        DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer, destruction_list=destruction_list
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

    def test_reassign_archivist_when_assigned(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_for_archivist, assignee=None
        )
        archivist = DestructionListAssigneeFactory.create(
            role=ListRole.archivist, destruction_list=destruction_list
        )

        destruction_list.reassign()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.assignee, archivist.user)

    @tag("gh-841")
    def test_assign_archivist_after_reassignement_when_changes_requested(self):
        """
        Test the assignement logic for this case:

        - Archivaris 1 has rejected a list, so the list was assigned to the record manager with status "changes_requested".
        - The record manager changed the archivaris to be archivaris 2.
        - The record manager submits the changes so the assignment logic needs to determine
          to whom it should be assigned next (archivaris 2).
        """
        archivist1 = UserFactory.create(post__can_review_final_list=True)
        archivist2 = UserFactory.create(post__can_review_final_list=True)
        reviewer = UserFactory.create(post__can_review_destruction=True)
        record_manager = UserFactory.create(post__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            status=ListStatus.changes_requested,
            assignee=record_manager,
        )
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list,
            user=archivist2,
            role=ListRole.archivist,
        )
        # A reviewer has already approved the list
        DestructionListReviewFactory.create(
            author=reviewer,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )
        # The archivaris rejected it, but it was then replaced by archivist 2.
        # So when assigning the next person, it should go to archivist 2
        DestructionListReviewFactory.create(
            author=archivist1,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.assignee, archivist2)

    @tag("gh-841")
    def test_assign_reviewer_after_reassignement_when_changes_requested(self):
        """
        Test the assignement logic for this case:

        - Reviewer 1 has rejected a list, so the list was assigned to the record manager with status "changes_requested".
        - The record manager changed the reviewer to be reviewer 2.
        - The record manager submits the changes so the assignment logic needs to determine
          to whom it should be assigned next (reviewer 2).
        """
        reviewer1 = UserFactory.create(post__can_review_destruction=True)
        reviewer2 = UserFactory.create(post__can_review_destruction=True)
        record_manager = UserFactory.create(post__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            status=ListStatus.changes_requested,
            assignee=record_manager,
        )
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list,
            user=reviewer2,
            role=ListRole.archivist,
        )
        DestructionListReviewFactory.create(
            author=reviewer1,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.accepted,
        )

        destruction_list.assign_next()

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.assignee, reviewer2)

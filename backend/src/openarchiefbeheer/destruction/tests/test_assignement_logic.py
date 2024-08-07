from unittest.mock import patch

from django.test import TestCase

from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import ListRole, ListStatus, ReviewDecisionChoices
from .factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListReviewFactory,
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
        zaak = ZaakFactory.create()
        DestructionListItemFactory.create(
            destruction_list=destruction_list, zaak=zaak.url
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
        zaak = ZaakFactory.create()
        DestructionListItemFactory.create(
            destruction_list=destruction_list, zaak=zaak.url
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
            return_value=ArchiveConfig(zaaktypes_short_process=[zaak.zaaktype]),
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

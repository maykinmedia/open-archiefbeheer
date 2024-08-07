from django.test import TestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..constants import ListRole
from ..utils import process_new_assignees
from .factories import DestructionListAssigneeFactory, DestructionListFactory


class ProcessNewReviewersTest(TestCase):
    def test_all_new_assignees_different(self):
        destruction_list = DestructionListFactory.create()
        DestructionListAssigneeFactory.create_batch(
            3, role=ListRole.reviewer, destruction_list=destruction_list
        )

        users = UserFactory.create_batch(2, role__can_review_destruction=True)
        new_assignee1 = {"user": users[0]}
        new_assignee2 = {"user": users[1]}

        process_new_assignees(
            destruction_list, [new_assignee1, new_assignee2], ListRole.reviewer
        )

        new_assignees = destruction_list.assignees.filter(
            role=ListRole.reviewer
        ).order_by("user__pk")

        self.assertEqual(2, new_assignees.count())
        self.assertEqual(users[0].pk, new_assignees[0].user.pk)
        self.assertEqual(users[1].pk, new_assignees[1].user.pk)

    def test_not_all_new_assignees_are_new(self):
        destruction_list = DestructionListFactory.create()
        old_assignees = DestructionListAssigneeFactory.create_batch(
            2, role=ListRole.reviewer, destruction_list=destruction_list
        )

        users = UserFactory.create_batch(2, role__can_review_destruction=True)
        new_assignee1 = {"user": users[0]}
        new_assignee2 = {"user": users[1]}
        new_assignee3 = {"user": old_assignees[0].user}

        process_new_assignees(
            destruction_list,
            [new_assignee1, new_assignee2, new_assignee3],
            ListRole.reviewer,
        )

        new_assignees = destruction_list.assignees.filter(
            role=ListRole.reviewer
        ).order_by("user__pk")

        self.assertEqual(3, new_assignees.count())
        self.assertEqual(old_assignees[0].user.pk, new_assignees[0].user.pk)
        self.assertEqual(users[0].pk, new_assignees[1].user.pk)
        self.assertEqual(users[1].pk, new_assignees[2].user.pk)

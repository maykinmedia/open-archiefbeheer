from django.utils.translation import gettext_lazy as _

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from timeline_logger.models import TimelineLog

from ...api.constants import MAX_NUMBER_CO_REVIEWERS
from ...constants import ListRole, ListStatus
from ..factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    UserFactory,
)


class CoReviewersViewSetTest(APITestCase):
    def test_get_all_coreviewers_for_list(self):
        destruction_list = DestructionListFactory.create()
        DestructionListAssigneeFactory.create_batch(
            3,
            role=ListRole.co_reviewer,
            user__post__can_co_review_destruction=True,
            destruction_list=destruction_list,
        )
        reviewer = DestructionListAssigneeFactory.create(
            user__username="reviewer",
            role=ListRole.main_reviewer,
            destruction_list=destruction_list,
        )

        self.client.force_authenticate(user=reviewer.user)
        response = self.client.get(
            reverse(
                "api:co-reviewers-list",
                kwargs={"destruction_list_uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(status.HTTP_200_OK, response.status_code)

        co_reviewers = destruction_list.assignees.filter(role=ListRole.co_reviewer)
        data = response.json()

        self.assertEqual(len(data), 3)
        self.assertTrue(
            all(
                [
                    co_reviewers.filter(user__pk=co_reviewer["user"]["pk"]).exists()
                    for co_reviewer in data
                ]
            )
        )

    def test_fully_update_co_reviewers(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review, name="A beautiful list"
        )
        DestructionListAssigneeFactory.create_batch(
            2,
            role=ListRole.co_reviewer,
            user__post__can_co_review_destruction=True,
            destruction_list=destruction_list,
        )
        new_co_reviewers = UserFactory.create_batch(
            3,
            post__can_co_review_destruction=True,
        )

        main_reviewer = DestructionListAssigneeFactory.create(
            user__username="reviewer",
            user__post__can_review_destruction=True,
            role=ListRole.main_reviewer,
            destruction_list=destruction_list,
        )

        destruction_list.assignee = main_reviewer.user
        destruction_list.save()

        self.client.force_authenticate(user=main_reviewer.user)
        response = self.client.put(
            reverse(
                "api:co-reviewers-list",
                kwargs={"destruction_list_uuid": destruction_list.uuid},
            ),
            data={
                "comment": "test",
                "add": [{"user": co_reviewer.pk} for co_reviewer in new_co_reviewers],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        new_assignees = destruction_list.assignees.filter(role=ListRole.co_reviewer)

        self.assertEqual(new_assignees.count(), 3)
        self.assertTrue(
            all(
                [
                    new_assignees.filter(user=co_reviewer).exists()
                    for co_reviewer in new_co_reviewers
                ]
            )
        )

        logs = TimelineLog.objects.for_object(destruction_list)

        self.assertEqual(len(logs), 1)

        message = logs[0].get_message()
        self.assertIn(
            _(
                'User "%(user)s" has replaced all the co-reviewers of the list '
                '"%(list_name)s" with: %(added_co_reviewers)s.'
            )
            % {
                "user": "reviewer",
                "list_name": "A beautiful list",
                "added_co_reviewers": ", ".join(
                    [
                        co_reviewer.get_name_with_username()
                        for co_reviewer in new_co_reviewers
                    ]
                ),
            },
            message,
        )
        self.assertIn(
            _("They added the comment: %(comment)s.")
            % {
                "comment": "test",
            },
            message,
        )
        self.assertNotIn(
            _("They also removed these co-reviewers: %(removed_co_reviewers)s.")
            % {
                "removed_co_reviewers": "",
            },
            message,
        )

    def test_partially_update_co_reviewers(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review, name="A beautiful list"
        )
        initial_assignee1 = DestructionListAssigneeFactory.create(
            role=ListRole.co_reviewer,
            user__post__can_co_review_destruction=True,
            destruction_list=destruction_list,
        )
        initial_assignee2 = DestructionListAssigneeFactory.create(
            role=ListRole.co_reviewer,
            user__post__can_co_review_destruction=True,
            destruction_list=destruction_list,
        )
        new_co_reviewers = UserFactory.create_batch(
            3,
            post__can_co_review_destruction=True,
        )

        main_reviewer = DestructionListAssigneeFactory.create(
            user__username="reviewer",
            user__post__can_review_destruction=True,
            role=ListRole.main_reviewer,
            destruction_list=destruction_list,
        )

        destruction_list.assignee = main_reviewer.user
        destruction_list.save()

        self.client.force_authenticate(user=main_reviewer.user)
        response = self.client.patch(
            reverse(
                "api:co-reviewers-list",
                kwargs={"destruction_list_uuid": destruction_list.uuid},
            ),
            data={
                "comment": "test",
                "add": [{"user": co_reviewer.pk} for co_reviewer in new_co_reviewers],
                "remove": [{"user": initial_assignee1.user.pk}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        assignees = destruction_list.assignees.filter(role=ListRole.co_reviewer)

        self.assertEqual(assignees.count(), 4)
        self.assertTrue(
            all(
                [
                    assignees.filter(user=co_reviewer).exists()
                    for co_reviewer in new_co_reviewers
                ]
            )
        )
        self.assertFalse(assignees.filter(user=initial_assignee1.user).exists())
        self.assertTrue(assignees.filter(user=initial_assignee2.user).exists())

        logs = TimelineLog.objects.for_object(destruction_list)

        self.assertEqual(len(logs), 1)

        message = logs[0].get_message()
        self.assertIn(
            _(
                'User "%(user)s" has added these users as co-reviewers to the list '
                '"%(list_name)s": %(added_co_reviewers)s.'
            )
            % {
                "user": "reviewer",
                "list_name": "A beautiful list",
                "added_co_reviewers": ", ".join(
                    [
                        co_reviewer.get_name_with_username()
                        for co_reviewer in new_co_reviewers
                    ]
                ),
            },
            message,
        )
        self.assertIn(
            _("They added the comment: %(comment)s.")
            % {
                "comment": "test",
            },
            message,
        )
        self.assertIn(
            _("They also removed these co-reviewers: %(removed_co_reviewers)s.")
            % {
                "removed_co_reviewers": initial_assignee1.user.get_name_with_username(),
            },
            message,
        )

    def test_cant_add_more_than_5_co_reviewers(self):
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )

        new_co_reviewers = UserFactory.create_batch(
            6,
            post__can_co_review_destruction=True,
        )

        main_reviewer = DestructionListAssigneeFactory.create(
            user__username="reviewer",
            user__post__can_review_destruction=True,
            role=ListRole.main_reviewer,
            destruction_list=destruction_list,
        )

        destruction_list.assignee = main_reviewer.user
        destruction_list.save()
        self.client.force_authenticate(user=main_reviewer.user)

        with self.subTest("Put endpoint"):
            response = self.client.put(
                reverse(
                    "api:co-reviewers-list",
                    kwargs={"destruction_list_uuid": destruction_list.uuid},
                ),
                data={
                    "comment": "test",
                    "add": [
                        {"user": co_reviewer.pk} for co_reviewer in new_co_reviewers
                    ],
                },
                format="json",
            )

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

            errors = response.json()

            self.assertEqual(
                errors["nonFieldErrors"][0],
                _("The maximum number of allowed co-reviewers is %(max_co_reviewers)s.")
                % {"max_co_reviewers": MAX_NUMBER_CO_REVIEWERS},
            )

        with self.subTest("Patch endpoint"):
            initial_assignees = DestructionListAssigneeFactory.create_batch(
                4,
                role=ListRole.co_reviewer,
                user__post__can_co_review_destruction=True,
                destruction_list=destruction_list,
            )
            response = self.client.patch(
                reverse(
                    "api:co-reviewers-list",
                    kwargs={"destruction_list_uuid": destruction_list.uuid},
                ),
                data={
                    "comment": "test",
                    "add": [
                        {"user": co_reviewer.pk} for co_reviewer in new_co_reviewers
                    ],
                    "remove": [{"user": initial_assignees[0].user.pk}],
                },
                format="json",
            )

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

            errors = response.json()

            self.assertEqual(
                errors["nonFieldErrors"][0],
                _("The maximum number of allowed co-reviewers is %(max_co_reviewers)s.")
                % {"max_co_reviewers": MAX_NUMBER_CO_REVIEWERS},
            )

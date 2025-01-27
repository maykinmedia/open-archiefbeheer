from unittest.mock import patch

from django.contrib.auth.models import Group
from django.core import mail
from django.test import tag
from django.utils.translation import gettext_lazy as _

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from timeline_logger.models import TimelineLog

from openarchiefbeheer.emails.models import EmailConfig

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
        reviewer_group, created = Group.objects.get_or_create(name="Reviewer")
        main_reviewer.user.groups.add(reviewer_group)

        destruction_list.assignee = main_reviewer.user
        destruction_list.save()

        self.client.force_authenticate(user=main_reviewer.user)

        with (
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_co_review_request="Please co-review!",
                    body_co_review_request_text="You have been invited to co-review.",
                    body_co_review_request_html="You have been invited to co-review.",
                ),
            ),
        ):
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

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test that the co-reviewers are as expected
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

        # Test that the changes have been logged
        logs = TimelineLog.objects.for_object(destruction_list)

        self.assertEqual(len(logs), 1)

        message = logs[0].get_message().strip()
        self.assertIn(
            _(
                "User %(user)s (member of group %(groups)s) has replaced all the co-reviewers "
                'of the list "%(list_name)s" with: %(added_co_reviewers)s.'
            )
            % {
                "user": main_reviewer.user,
                "list_name": "A beautiful list",
                "added_co_reviewers": ", ".join(
                    [str(user) for user in new_co_reviewers]
                ),
                "groups": "Reviewer",
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

        # Test that the new co-reviewers have been notified
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Please co-review!")
        self.assertEqual(mail.outbox[0].body, "You have been invited to co-review.")
        self.assertEqual(
            sorted(mail.outbox[0].recipients()),
            sorted([co_reviewer.email for co_reviewer in new_co_reviewers]),
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
        reviewer_group, created = Group.objects.get_or_create(name="Reviewer")
        main_reviewer.user.groups.add(reviewer_group)

        destruction_list.assignee = main_reviewer.user
        destruction_list.save()

        self.client.force_authenticate(user=main_reviewer.user)
        with (
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_co_review_request="Please co-review!",
                    body_co_review_request_text="You have been invited to co-review.",
                    body_co_review_request_html="You have been invited to co-review.",
                ),
            ),
        ):
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
                    "remove": [{"user": initial_assignee1.user.pk}],
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test that the co-reviewers are as expected
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

        # Test that the changes have been logged
        logs = TimelineLog.objects.for_object(destruction_list)

        self.assertEqual(len(logs), 1)

        message = logs[0].get_message()
        self.assertIn(
            _(
                "User %(user)s (member of group %(groups)s) has added these users as co-"
                'reviewers to the list "%(list_name)s": %(added_co_reviewers)s.'
            )
            % {
                "user": main_reviewer.user,
                "list_name": "A beautiful list",
                "groups": "Reviewer",
                "added_co_reviewers": ", ".join(
                    [str(user) for user in new_co_reviewers]
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
                "removed_co_reviewers": initial_assignee1.user,
            },
            message,
        )

        # Test that the new co-reviewers have been notified
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Please co-review!")
        self.assertEqual(mail.outbox[0].body, "You have been invited to co-review.")
        self.assertEqual(
            sorted(mail.outbox[0].recipients()),
            sorted([co_reviewer.email for co_reviewer in new_co_reviewers]),
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

    @tag("gh-493")
    def test_options_method(self):
        destruction_list = DestructionListFactory.create()
        assignee = DestructionListAssigneeFactory.create(
            destruction_list=destruction_list,
        )

        self.client.force_authenticate(user=assignee.user)
        response = self.client.options(
            reverse(
                "api:co-reviewers-list",
                kwargs={"destruction_list_uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(status.HTTP_200_OK, response.status_code)

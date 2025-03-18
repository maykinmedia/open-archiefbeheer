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
        self.assertEqual(
            _(
                "The co-reviewers were updated. The co-reviewers are now: %(co_reviewers)s."
            )
            % {
                "co_reviewers": ", ".join([str(user) for user in new_co_reviewers]),
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
        self.assertEqual(
            _(
                "The co-reviewers were updated. The co-reviewers are now: %(co_reviewers)s."
            )
            % {
                "co_reviewers": ", ".join(
                    [str(user) for user in [initial_assignee2.user, *new_co_reviewers]]
                ),
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

    @tag("gh-637")
    def test_record_manager_assigns_themselves(self):
        record_manager = UserFactory.create(
            username="record_manager",
            post__can_start_destruction=True,
            post__can_co_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review,
            name="List to test assignement errors",
            author=record_manager,
        )
        DestructionListAssigneeFactory.create(
            role=ListRole.author,
            user=record_manager,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer,
            destruction_list=destruction_list,
        )

        self.client.force_authenticate(user=record_manager)
        response = self.client.put(
            reverse(
                "api:co-reviewers-list",
                kwargs={"destruction_list_uuid": destruction_list.uuid},
            ),
            data={
                "comment": "test",
                "add": [{"user": record_manager.pk}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["add"][0]["user"][0],
            _("The author of a list cannot be assigned as a co-reviewer."),
        )

    @tag("gh-663")
    def test_record_manager_assigns_themselves_to_new_list(self):
        author = UserFactory.create(
            username="record_manager",
            post__can_start_destruction=True,
        )
        administrator = UserFactory.create(
            username="administrator",
            post__can_start_destruction=True,
            post__can_co_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            status=ListStatus.new, name="Test assignement to new list", author=author
        )
        DestructionListAssigneeFactory.create(
            role=ListRole.author,
            user=author,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer,
            destruction_list=destruction_list,
        )

        self.client.force_authenticate(user=administrator)
        response = self.client.put(
            reverse(
                "api:co-reviewers-list",
                kwargs={"destruction_list_uuid": destruction_list.uuid},
            ),
            data={
                "comment": "test",
                "add": [{"user": administrator.pk}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        coreviewers = destruction_list.assignees.filter(role=ListRole.co_reviewer)

        self.assertEqual(1, len(coreviewers))
        self.assertEqual(coreviewers[0].user.pk, administrator.pk)

    @tag("gh-663")
    def test_record_manager_changes_coreviewers_list(self):
        author = UserFactory.create(
            username="record_manager",
            post__can_start_destruction=True,
        )
        reviewer = UserFactory.create(
            username="reviewer",
            post__can_review_destruction=True,
        )
        administrator = UserFactory.create(
            username="administrator",
            post__can_start_destruction=True,
            post__can_co_review_destruction=True,
            post__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            status=ListStatus.new,
            name="Test assignement to new list",
            author=author,
            assignee=reviewer,
        )
        DestructionListAssigneeFactory.create(
            role=ListRole.author,
            user=author,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            role=ListRole.main_reviewer,
            destruction_list=destruction_list,
            user=reviewer,
        )

        self.client.force_authenticate(user=administrator)
        response = self.client.put(
            reverse(
                "api:co-reviewers-list",
                kwargs={"destruction_list_uuid": destruction_list.uuid},
            ),
            data={
                "comment": "test",
                "add": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        coreviewers = destruction_list.assignees.filter(role=ListRole.co_reviewer)

        self.assertEqual(0, len(coreviewers))

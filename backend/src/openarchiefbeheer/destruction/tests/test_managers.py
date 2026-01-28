from datetime import timedelta

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase, override_settings
from django.utils import timezone

import freezegun

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import InternalStatus, ListStatus
from openarchiefbeheer.destruction.models import DestructionList
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
)


class DestructionListQuerySetTests(TestCase):
    @freezegun.freeze_time("2023-09-15")
    @override_settings(POST_DESTRUCTION_VISIBILITY_PERIOD=1)
    def test_active(self):
        active = DestructionListFactory.create(status=ListStatus.new)
        recent_deleted = DestructionListFactory.create(
            status=ListStatus.deleted,
            end=timezone.now() - timedelta(days=1),
        )
        deleted = DestructionListFactory.create(
            status=ListStatus.deleted,
            end=timezone.now() - timedelta(days=2),
        )
        # A list that is completely destroyed but failed to create a destruction report.
        failed = DestructionListFactory.create(
            status=ListStatus.deleted,
            end=timezone.now() - timedelta(days=2),
            processing_status=InternalStatus.failed,
        )

        lists = set(DestructionList.objects.active())

        self.assertEqual(len(lists), 3)
        self.assertSetEqual(lists, {active, recent_deleted, failed})
        self.assertNotIn(deleted, lists)

    def test_completed(self):
        active = DestructionListFactory.create(status=ListStatus.new)
        recent_deleted = DestructionListFactory.create(
            status=ListStatus.deleted,
            end=timezone.now() - timedelta(days=1),
        )
        deleted = DestructionListFactory.create(
            status=ListStatus.deleted,
            end=timezone.now() - timedelta(days=2),
        )
        # A list that is completely destroyed but failed to create a destruction report.
        failed = DestructionListFactory.create(
            status=ListStatus.deleted,
            end=timezone.now() - timedelta(days=2),
            processing_status=InternalStatus.failed,
        )

        lists = DestructionList.objects.completed()

        self.assertEqual(len(lists), 2)
        self.assertEqual(lists[0], recent_deleted)
        self.assertEqual(lists[1], deleted)
        self.assertNotIn(active, lists)
        self.assertNotIn(failed, lists)

    def test_permitted_for_user_unprivileged(self):
        user = UserFactory.create(post__can_start_destruction=False)
        DestructionListFactory.create()
        lists = DestructionList.objects.permitted_for_user(user)
        self.assertEqual(len(lists), 0)

    def test_permitted_for_user_record_manger(self):
        user = UserFactory.create(post__can_start_destruction=True)
        DestructionListFactory.create()
        lists = DestructionList.objects.permitted_for_user(user)
        self.assertEqual(len(lists), 1)

    def test_permitted_for_user_assignee(self):
        user = UserFactory.create()
        destruction_list = DestructionListFactory.create()
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list, user=user
        )
        lists = DestructionList.objects.permitted_for_user(user)
        self.assertEqual(len(lists), 1)

    def test_annotate_user_permissions(self):
        content_type = ContentType.objects.get_for_model(DestructionList)

        group = Group.objects.create()
        group_permission = Permission.objects.create(
            codename="group_permission", content_type=content_type
        )
        group.permissions.add(group_permission)

        user_permission = Permission.objects.create(
            codename="user_permission", content_type=content_type
        )

        assignees = DestructionListAssigneeFactory.create_batch(3)
        author = assignees[0].user
        author.user_permissions.add(user_permission)
        destruction_lists = DestructionListFactory.create_batch(100, author=author)
        for destruction_list in destruction_lists:
            destruction_list.assignees.set(assignees)

        with self.assertNumQueries(11):
            ls = list(  # List to force QuerySet evaluation.
                DestructionList.objects.filter(
                    author=author
                ).annotate_user_permissions()
            )
            for i in range(0, len(ls)):
                self.assertIn("user_permission", ls[i].author.user_permission_codenames)

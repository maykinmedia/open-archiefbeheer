from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase

from openarchiefbeheer.destruction.models import DestructionList
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
)


class DestructionListQuerySetTests(TestCase):
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

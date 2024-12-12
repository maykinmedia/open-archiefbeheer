from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase

from openarchiefbeheer.destruction.models import DestructionList

from ..models import User
from .factories import UserFactory


class UserQuerySetTests(TestCase):
    def test_annotate_permissions(self):
        content_type = ContentType.objects.get_for_model(DestructionList)

        group = Group.objects.create()
        group_permission = Permission.objects.create(
            codename="group_permission", content_type=content_type
        )
        group.permissions.add(group_permission)

        user_permission = Permission.objects.create(
            codename="user_permission", content_type=content_type
        )

        users = UserFactory.create_batch(3)
        for user in users:
            user.user_permissions.add(user_permission)
            user.groups.add(group)

        with self.assertNumQueries(1):
            ls = list(  # List to force QuerySet evaluation.
                User.objects.annotate_permissions().values_list(
                    "user_permission_codenames", flat=True
                )
            )

            self.assertIn("user_permission", ls[0])
            self.assertIn("user_permission", ls[1])
            self.assertIn("user_permission", ls[2])

        with self.assertNumQueries(1):
            ls = list(  # List to force QuerySet evaluation.
                User.objects.annotate_permissions().values_list(
                    "group_permission_codenames", flat=True
                )
            )

            self.assertIn("group_permission", ls[0])
            self.assertIn("group_permission", ls[1])
            self.assertIn("group_permission", ls[2])


class UserManagerTests(TestCase):
    def test_create_superuser(self):
        user = User.objects.create_superuser("god", "god@heaven.com", "praisejebus")
        self.assertIsNotNone(user.pk)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.username, "god")
        self.assertEqual(user.email, "god@heaven.com")
        self.assertTrue(user.check_password("praisejebus"))
        self.assertNotEqual(user.password, "praisejebus")

    def test_create_user(self):
        user = User.objects.create_user("infidel")
        self.assertIsNotNone(user.pk)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.has_usable_password())

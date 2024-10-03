from openarchiefbeheer.utils.tests.migrations_tests import TestMigrations


class TestAddGroups(TestMigrations):
    app = "accounts"
    migrate_from = "0003_role_can_review_final_list"
    migrate_to = "0006_remove_user_role_delete_role"

    def setUpBeforeMigration(self, apps):
        User = apps.get_model("accounts", "User")
        Role = apps.get_model("accounts", "Role")

        administrator = Role.objects.get(
            name="Administrator",
        )
        record_manager = Role.objects.get(
            name="Record Manager",
        )
        reviewer = Role.objects.get(
            name="Reviewer",
        )
        archivist = Role.objects.get(
            name="Archivist",
        )

        self.user_admin = User.objects.create(username="admin1", role=administrator)
        self.user_record_manager = User.objects.create(
            username="rm1", role=record_manager
        )
        self.user_reviewer = User.objects.create(username="r1", role=reviewer)
        self.user_archivist = User.objects.create(username="a1", role=archivist)
        self.user_no_role = User.objects.create(username="no_role")

    def test_groups_and_permissions(self):
        self.assertEqual(self.user_admin.groups.get().name, "Administrator")
        self.assertEqual(self.user_record_manager.groups.get().name, "Record Manager")
        self.assertEqual(self.user_reviewer.groups.get().name, "Reviewer")
        self.assertEqual(self.user_archivist.groups.get().name, "Archivist")
        self.assertFalse(self.user_no_role.groups.filter().exists())


class TestReAddRoles(TestMigrations):
    app = "accounts"
    migrate_from = "0006_remove_user_role_delete_role"
    migrate_to = "0003_role_can_review_final_list"

    def setUpBeforeMigration(self, apps):
        User = apps.get_model("accounts", "User")
        Group = apps.get_model("auth", "Group")

        administrator, _ = Group.objects.get_or_create(
            name="Administrator",
        )
        record_manager, _ = Group.objects.get_or_create(
            name="Record Manager",
        )
        reviewer, _ = Group.objects.get_or_create(
            name="Reviewer",
        )
        archivist, _ = Group.objects.get_or_create(
            name="Archivist",
        )

        self.user_admin = User.objects.create(username="admin1")
        self.user_admin.groups.add(administrator)

        self.user_record_manager = User.objects.create(username="rm1")
        self.user_record_manager.groups.add(record_manager)

        self.user_reviewer = User.objects.create(username="r1")
        self.user_reviewer.groups.add(reviewer)

        self.user_archivist = User.objects.create(username="a1")
        self.user_archivist.groups.add(archivist)

        self.user_no_role = User.objects.create(username="no_role")

    def test_groups_and_permissions(self):
        User = self.apps.get_model("accounts", "User")

        users = User.objects.all()

        self.assertEqual(users.get(username="admin1").role.name, "Administrator")
        self.assertEqual(users.get(username="rm1").role.name, "Record Manager")
        self.assertEqual(users.get(username="r1").role.name, "Reviewer")
        self.assertEqual(users.get(username="a1").role.name, "Archivist")
        self.assertIsNone(users.get(username="no_role").role)

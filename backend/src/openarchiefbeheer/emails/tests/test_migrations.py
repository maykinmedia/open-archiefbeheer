from openarchiefbeheer.utils.tests.migrations_tests import TestMigrations


class TestEmailConfigurationDefaults(TestMigrations):
    app = "emails"
    migrate_from = "0007_remove_emailconfig_body_changes_requested_and_more"
    migrate_to = "0008_alter_emailconfig_body_changes_requested_html_and_more"

    def setUpBeforeMigration(self, apps):  # noqa: N802
        EmailConfig = apps.get_model("emails", "EmailConfig")

        self.config = EmailConfig.objects.get()
        self.config.subject_review_required = ""
        self.config.body_review_required_html = "some already configured content"
        self.config.save()

    def test_defaults(self):
        self.config.refresh_from_db()
        with self.subTest("default is added"):
            self.assertEqual(
                self.config.subject_review_required,
                "Uw accordering van een vernietigingslijst wordt gevraagd",
            )

        with self.subTest("Existing config is not overridden"):
            self.assertEqual(
                self.config.body_review_required_html,
                "some already configured content",
            )

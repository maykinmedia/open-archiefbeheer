from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from django_webtest import WebTest
from maykin_2fa.test import disable_admin_mfa

from openarchiefbeheer.accounts.tests.factories import UserFactory


@disable_admin_mfa()
class EmailsAdminTest(WebTest):
    def test_view_url_exists_at_desired_location(self):
        user = UserFactory.create(is_staff=True, is_superuser=True)

        response = self.app.get(reverse("admin:emails_emailconfig_change"), user=user)

        self.assertEqual(response.status_code, 200)

    def test_template_is_validated(self):
        user = UserFactory.create(is_staff=True, is_superuser=True)

        response = self.app.get(reverse("admin:emails_emailconfig_change"), user=user)
        self.assertEqual(response.status_code, 200)

        form = response.form
        form["body_review_required_html"] = "<p>HTML with template errors {% if %}</p>"
        form["body_review_required_text"] = "Text with template errors {% if %}"
        form["body_co_review_request_text"] = "Some text without errors"
        response_submission = form.submit()

        self.assertEqual(response_submission.status_code, 200)
        error_list = response_submission.html.find_all("ul", class_="errorlist")
        self.assertEqual(len(error_list), 2)
        self.assertEqual(
            _("Error in template: {e}").format(
                e="Unexpected end of expression in if tag."
            ),
            error_list[0].string,
        )
        self.assertEqual(
            _("Error in template: {e}").format(
                e="Unexpected end of expression in if tag."
            ),
            error_list[1].string,
        )

from django.test import TestCase
from django.urls import reverse

from maykin_2fa.test import disable_admin_mfa

from openarchiefbeheer.accounts.tests.factories import UserFactory


@disable_admin_mfa()
class EmailsAdminTest(TestCase):
    def test_view_url_exists_at_desired_location(self):
        user = UserFactory.create(is_staff=True, is_superuser=True)

        self.client.force_login(user)

        response = self.client.get(reverse("admin:emails_emailconfig_change"))

        self.assertEqual(response.status_code, 200)

from django.urls import reverse

from django_webtest import WebTest
from maykin_2fa.test import disable_admin_mfa

from openarchiefbeheer.accounts.tests.factories import UserFactory


class HealthCheckTests(WebTest):
    @disable_admin_mfa()
    def test_health_check(self):
        user = UserFactory.create(superuser=True)
        url = reverse("admin:index")

        response = self.app.get(url, user=user)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            len(response.html.find_all(id="configuration-health-check")), 1
        )

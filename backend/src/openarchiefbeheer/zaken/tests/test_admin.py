from unittest.mock import patch

from django.contrib import messages
from django.contrib.messages.api import get_messages
from django.test import TestCase
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from maykin_2fa.test import disable_admin_mfa

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..tasks import resync_zaken


@disable_admin_mfa()
class ZakenAdminTest(TestCase):
    def test_not_logged_in_cannot_access(self):
        response = self.client.post(reverse("admin:zaken_zaak_changelist"))

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.url, f"/admin/login/?next={reverse("admin:zaken_zaak_changelist")}"
        )

    def test_schedule_resync(self):
        user = UserFactory.create(is_superuser=True, is_staff=True)

        self.client.force_login(user)

        with patch.object(resync_zaken, "delay") as m:
            response = self.client.post(reverse("admin:resync-zaken"), follow=True)

            self.assertEqual(response.status_code, 200)
            m.assert_called_once()

            request_messages = list(get_messages(response.wsgi_request))

            self.assertEqual(
                request_messages[0].level_tag, messages.DEFAULT_TAGS[messages.SUCCESS]
            )
            self.assertEqual(
                request_messages[0].message,
                _(
                    "Syncing of the zaken will happen in the background. It may take a while."
                ),
            )

    def test_wrong_http_method(self):
        user = UserFactory.create(is_superuser=True, is_staff=True)

        self.client.force_login(user)

        with patch.object(resync_zaken, "delay") as m:
            response = self.client.get(
                reverse("admin:resync-zaken"), follow=True
            )  # get instead of post

            self.assertEqual(response.status_code, 200)
            m.assert_not_called()

            request_messages = list(get_messages(response.wsgi_request))

            self.assertEqual(
                request_messages[0].level_tag, messages.DEFAULT_TAGS[messages.ERROR]
            )
            self.assertEqual(
                request_messages[0].message, _("Only POST request supported.")
            )

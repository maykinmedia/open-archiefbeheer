from unittest.mock import patch

from django.test import override_settings, tag
from django.utils.translation import gettext as _

from mozilla_django_oidc_db.models import OpenIDConnectConfig
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..api.validators import RSIN_LENGTH
from ..models import APIConfig, ArchiveConfig


class ArchiveConfigViews(APITestCase):
    def test_not_authenticated(self):
        response = self.client.get(reverse("api:archive-config"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_can_retrieve(self):
        user = UserFactory.create()

        self.client.force_login(user)
        response = self.client.get(reverse("api:archive-config"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("zaaktypesShortProcess", response.json())

    def test_not_administrator_update(self):
        user = UserFactory.create(post__can_start_destruction=True)

        self.client.force_login(user)
        response = self.client.put(
            reverse("api:archive-config"),
            data={"zaaktypesShortProcess": ["ZAAKTYPE-TRALALA"]},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_administrator_update(self):
        user = UserFactory.create(
            post__can_configure_application=True,
        )

        self.client.force_login(user)
        response = self.client.put(
            reverse("api:archive-config"),
            data={
                "zaaktypesShortProcess": ["ZAAKTYPE-TRALALA"],
                "bronorganisatie": "000000000",
                "zaaktype": "http://bla.nl",
                "statustype": "http://bla.nl",
                "resultaattype": "http://bla.nl",
                "informatieobjecttype": "http://bla.nl",
                "selectielijstklasse": "http://bla.nl",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        config = ArchiveConfig.get_solo()

        self.assertEqual(config.zaaktypes_short_process, ["ZAAKTYPE-TRALALA"])

    def test_administrator_partial_update(self):
        user = UserFactory.create(
            post__can_configure_application=True,
        )

        self.client.force_login(user)
        response = self.client.patch(
            reverse("api:archive-config"),
            data={"zaaktypesShortProcess": ["ZAAKTYPE-TRALALA"]},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        config = ArchiveConfig.get_solo()

        self.assertEqual(config.zaaktypes_short_process, ["ZAAKTYPE-TRALALA"])

    @tag("gh-227")
    @override_settings(SOLO_CACHE=None)
    def test_can_send_empty_list(self):
        user = UserFactory.create(
            post__can_configure_application=True,
        )

        config = ArchiveConfig.get_solo()
        config.zaaktypes_short_process = ["ZAAKTYPE-TRALALA"]
        config.save()

        self.client.force_login(user)
        response = self.client.patch(
            reverse("api:archive-config"),
            data={"zaaktypesShortProcess": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        config = ArchiveConfig.get_solo()

        self.assertEqual(config.zaaktypes_short_process, [])

    @override_settings(SOLO_CACHE=None)
    def test_can_send_empty_statustype(self):
        user = UserFactory.create(
            post__can_configure_application=True,
        )

        config = ArchiveConfig.get_solo()
        config.statustype = "http://bla.nl"
        config.resultaattype = "http://bla.nl"
        config.save()

        self.client.force_login(user)
        response = self.client.patch(
            reverse("api:archive-config"),
            data={"statustype": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        config = ArchiveConfig.get_solo()

        self.assertEqual(config.statustype, "")

    @tag("gh-827")
    @override_settings(SOLO_CACHE=None)
    def test_validate_bronorganisatie(self):
        user = UserFactory.create(post__can_start_destruction=True)
        self.client.force_login(user)

        with self.subTest("Non-digits"):
            response = self.client.patch(
                reverse("api:archive-config"),
                data={"bronorganisatie": "AAAAAAAAA"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                response.json()["bronorganisatie"][0],
                _("The characters can only be digits."),
            )

        with self.subTest("Wrong length"):
            response = self.client.patch(
                reverse("api:archive-config"),
                data={"bronorganisatie": "000"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                response.json()["bronorganisatie"][0],
                _("A RSIN must be %(length)s characters long.")
                % {"length": RSIN_LENGTH},
            )

        with self.subTest("Fail 11-proef check"):
            response = self.client.patch(
                reverse("api:archive-config"),
                data={"bronorganisatie": "123456789"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(response.json()["bronorganisatie"][0], _("Invalid RSIN."))

        with self.subTest("Valid bronorganisatie"):
            response = self.client.patch(
                reverse("api:archive-config"),
                data={"bronorganisatie": "123456782"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)


class OIDCInfoViewTests(APITestCase):
    def test_oidc_info_view_not_enabled(self):
        config_url = reverse("api:oidc-info")
        with patch(
            "openarchiefbeheer.config.api.views.OpenIDConnectConfig.get_solo",
            return_value=OpenIDConnectConfig(enabled=False),
        ):
            response = self.client.get(config_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertFalse(data["enabled"])
        self.assertEqual(data["loginUrl"], "")

    def test_oidc_info_view_enabled(self):
        config_url = reverse("api:oidc-info")
        with patch(
            "openarchiefbeheer.config.api.views.OpenIDConnectConfig.get_solo",
            return_value=OpenIDConnectConfig(enabled=True),
        ):
            response = self.client.get(config_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertTrue(data["enabled"])
        self.assertEqual(data["loginUrl"], "http://testserver/oidc/authenticate/")


class HealthCheckViewTests(APITestCase):
    def test_not_logged_in(self):
        with (
            patch(
                "openarchiefbeheer.config.health_checks.APIConfig.get_solo",
                return_value=APIConfig(),
            ),
            patch(
                "openarchiefbeheer.config.health_checks.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(),
            ),
        ):
            response = self.client.get(reverse("api:health-check"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_health_check(self):
        user = UserFactory.create()
        self.client.force_login(user)

        with (
            patch(
                "openarchiefbeheer.config.health_checks.APIConfig.get_solo",
                return_value=APIConfig(),
            ),
            patch(
                "openarchiefbeheer.config.health_checks.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(),
            ),
        ):
            response = self.client.get(reverse("api:health-check"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["success"])


@override_settings(RELEASE="1.0.0", GIT_SHA="123")
class ApplicationInfoTests(APITestCase):
    def test_not_logged_in(self):
        response = self.client.get(reverse("api:app-info"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_app_info(self):
        user = UserFactory.create()
        self.client.force_login(user)

        response = self.client.get(reverse("api:app-info"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["release"], "1.0.0")
        self.assertEqual(data["gitSha"], "123")

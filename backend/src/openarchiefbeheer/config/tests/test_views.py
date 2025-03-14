from unittest.mock import patch

from django.test import override_settings, tag

from mozilla_django_oidc_db.models import OpenIDConnectConfig
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

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

    def test_not_record_manager_update(self):
        user = UserFactory.create(post__can_start_destruction=False)

        self.client.force_login(user)
        response = self.client.put(
            reverse("api:archive-config"),
            data={"zaaktypesShortProcess": ["ZAAKTYPE-TRALALA"]},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_record_manager_update(self):
        user = UserFactory.create(post__can_start_destruction=True)

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

    def test_record_manager_partial_update(self):
        user = UserFactory.create(post__can_start_destruction=True)

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
        user = UserFactory.create(post__can_start_destruction=True)

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
    def test_can_send_empty_statustype_and_resultaat_type(self):
        user = UserFactory.create(post__can_start_destruction=True)

        config = ArchiveConfig.get_solo()
        config.statustype = "http://bla.nl"
        config.resultaattype = "http://bla.nl"
        config.selectielijstklasse = "http://bla.nl"
        config.save()

        self.client.force_login(user)
        response = self.client.patch(
            reverse("api:archive-config"),
            data={"statustype": "", "resultaattype": "", "selectielijstklasse": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        config = ArchiveConfig.get_solo()

        self.assertEqual(config.statustype, "")
        self.assertEqual(config.resultaattype, "")
        self.assertEqual(config.selectielijstklasse, "")


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

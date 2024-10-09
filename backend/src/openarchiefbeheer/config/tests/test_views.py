from django.test import override_settings, tag

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..models import ArchiveConfig


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
            data={"zaaktypesShortProcess": ["http://tralala.nl"]},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_record_manager_update(self):
        user = UserFactory.create(post__can_start_destruction=True)

        self.client.force_login(user)
        response = self.client.put(
            reverse("api:archive-config"),
            data={
                "zaaktypesShortProcess": ["http://tralala.nl"],
                "bronorganisatie": "000000000",
                "zaaktype": "http://bla.nl",
                "statustype": "http://bla.nl",
                "resultaattype": "http://bla.nl",
                "informatieobjecttype": "http://bla.nl",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        config = ArchiveConfig.get_solo()

        self.assertEqual(config.zaaktypes_short_process, ["http://tralala.nl"])

    def test_record_manager_partial_update(self):
        user = UserFactory.create(post__can_start_destruction=True)

        self.client.force_login(user)
        response = self.client.patch(
            reverse("api:archive-config"),
            data={"zaaktypesShortProcess": ["http://tralala.nl"]},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        config = ArchiveConfig.get_solo()

        self.assertEqual(config.zaaktypes_short_process, ["http://tralala.nl"])

    @tag("gh-227")
    @override_settings(SOLO_CACHE=None)
    def test_can_send_empty_list(self):
        user = UserFactory.create(post__can_start_destruction=True)

        config = ArchiveConfig.get_solo()
        config.zaaktypes_short_process = ["http://tralala.nl"]
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

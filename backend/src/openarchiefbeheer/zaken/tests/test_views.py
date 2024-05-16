from unittest.mock import patch

from django.core.cache import cache
from django.utils.translation import gettext_lazy as _

from requests_mock import Mocker
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..tasks import retrieve_and_cache_zaken_from_openzaak


class ZakenViewsTestCase(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-zaken")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(is_staff=False)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaken")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cache_zaken(self):
        user = UserFactory.create(is_staff=True)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaken")

        with patch.object(
            retrieve_and_cache_zaken_from_openzaak,
            "delay",
        ) as m:
            response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        m.assert_called_once()


class ZaaktypenChoicesViewsTestCase(APITestCase):
    def setUp(self):
        super().setUp()

        self.addCleanup(cache.clear)

    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-zaaktypen-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(role__can_start_destruction=False)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaaktypen-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @Mocker()
    def test_retrieve_zaaktypen_choices(self, m):
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://catalogi-api.nl/catalogi/api/v1",
        )
        user = UserFactory.create(role__can_start_destruction=True)

        m.get(
            "http://catalogi-api.nl/catalogi/api/v1/zaaktypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                        "omschrijving": "Zaaktype 1",
                        "identificatie": "ZAAK-01",
                    },
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
                        "omschrijving": "Zaaktype 2",
                        "identificatie": "ZAAK-02",
                        "eindGeldigheid": "2023-01-01",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaaktypen-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                    "extra": "ZAAK-01",
                    "label": "Zaaktype 1",
                },
                {
                    "value": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
                    "extra": _("%(identificatie)s (valid until %(end_validity)s)")
                    % {"identificatie": "ZAAK-02", "end_validity": "2023-01-01"},
                    "label": "Zaaktype 2",
                },
            ],
        )

    @Mocker()
    def test_response_cached(self, m):
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://catalogi-api.nl/catalogi/api/v1",
        )
        user = UserFactory.create(role__can_start_destruction=True)

        m.get(
            "http://catalogi-api.nl/catalogi/api/v1/zaaktypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                        "omschrijving": "Zaaktype 1",
                        "identificatie": "ZAAK-01",
                    },
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
                        "omschrijving": "Zaaktype 2",
                        "identificatie": "ZAAK-02",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaaktypen-choices")

        self.client.get(endpoint)
        self.client.get(endpoint)

        history = m.request_history
        self.assertEqual(len(history), 1)

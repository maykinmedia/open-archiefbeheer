from unittest.mock import patch

from django.core.cache import cache

from furl import furl
from requests_mock import Mocker
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
)

from ..tasks import retrieve_and_cache_zaken_from_openzaak
from .factories import ZaakFactory


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
        ZaakFactory.create(
            zaaktype="http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
            _expand={"zaaktype": {"identificatie": "ZAAK-01"}},
        )
        ZaakFactory.create(
            zaaktype="http://catalogi-api.nl/catalogi/api/v1/zaakypen/333-333-333",
            _expand={"zaaktype": {"identificatie": "ZAAK-02"}},
        )

        m.get(
            "http://catalogi-api.nl/catalogi/api/v1/zaaktypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                        "identificatie": "ZAAK-01",
                    },
                    # Different version of the zaaktype above
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
                        "identificatie": "ZAAK-01",
                    },
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/333-333-333",
                        "identificatie": "ZAAK-02",
                    },
                    # No zaken with this zaaktype in the DB
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/444-444-444",
                        "identificatie": "ZAAK-03",
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
                    "value": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111,http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
                    "label": "ZAAK-01",
                },
                {
                    "value": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/333-333-333",
                    "label": "ZAAK-02",
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

    def test_retrieve_zaaktypen_choices_for_destruction_list(self):
        user = UserFactory.create(role__can_start_destruction=True)

        destruction_list = DestructionListFactory.create()
        # The zaaktypen of these items should be returned,
        # because they are in the destruction list with status 'suggested'
        items_in_list = DestructionListItemFactory.create_batch(
            3,
            with_zaak=True,
            zaak__with_expand=True,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        # We simulate 2 items having different versions of the same zaaktype
        items_in_list[0].zaak._expand["zaaktype"]["identificatie"] = "ZAAKTYPE-1"
        items_in_list[0].zaak.save()
        items_in_list[1].zaak._expand["zaaktype"]["identificatie"] = "ZAAKTYPE-1"
        items_in_list[1].zaak.save()
        items_in_list[2].zaak._expand["zaaktype"]["identificatie"] = "ZAAKTYPE-2"
        items_in_list[2].zaak.save()

        # This zaaktype should NOT be returned because it has status 'removed'
        DestructionListItemFactory.create(
            with_zaak=True,
            destruction_list=destruction_list,
            status=ListItemStatus.removed,
        )
        # These zaaktypen should NOT be returned because it is not related to the list
        DestructionListItemFactory.create_batch(2, with_zaak=True)

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-zaaktypen-choices"))
        endpoint.args["destruction_list"] = destruction_list.uuid

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        choices = sorted(response.json(), key=lambda choice: choice["label"])

        self.assertEqual(len(choices), 2)
        self.assertEqual(choices[0]["label"], "ZAAKTYPE-1")
        self.assertEqual(choices[1]["label"], "ZAAKTYPE-2")

        values = choices[0]["value"].split(",")

        self.assertEqual(len(values), 2)
        self.assertIn(items_in_list[0].zaak.zaaktype, values)
        self.assertIn(items_in_list[1].zaak.zaaktype, values)

        self.assertEqual(choices[1]["value"], items_in_list[2].zaak.zaaktype)

    @Mocker()
    def test_not_cached_if_query_param_chages(self, m):
        user = UserFactory.create(role__can_start_destruction=True)

        destruction_list = DestructionListFactory.create()

        items_in_list = DestructionListItemFactory.create_batch(
            2,
            with_zaak=True,
            zaak__with_expand=True,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        items_in_list[0].zaak._expand["zaaktype"]["identificatie"] = "ZAAKTYPE-1"
        items_in_list[0].zaak.save()
        items_in_list[1].zaak._expand["zaaktype"]["identificatie"] = "ZAAKTYPE-2"
        items_in_list[1].zaak.save()

        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://catalogi-api.nl/catalogi/api/v1",
        )
        ZaakFactory.create(
            zaaktype="http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
            _expand={"zaaktype": {"identificatie": "ZAAKTYPE-3"}},
        )
        ZaakFactory.create(
            zaaktype="http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
            _expand={"zaaktype": {"identificatie": "ZAAKTYPE-4"}},
        )
        ZaakFactory.create(
            zaaktype="http://catalogi-api.nl/catalogi/api/v1/zaakypen/333-333-333",
            _expand={"zaaktype": {"identificatie": "ZAAKTYPE-5"}},
        )

        m.get(
            "http://catalogi-api.nl/catalogi/api/v1/zaaktypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                        "identificatie": "ZAAKTYPE-3",
                    },
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
                        "identificatie": "ZAAKTYPE-4",
                    },
                    {
                        "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/333-333-333",
                        "identificatie": "ZAAKTYPE-5",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-zaaktypen-choices"))
        endpoint.args["destruction_list"] = destruction_list.uuid

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

        del endpoint.args["destruction_list"]
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 3)

    def test_retrieve_zaaktypen_choices_for_review(self):
        user = UserFactory.create(role__can_start_destruction=True)

        review = DestructionListReviewFactory.create()
        # The zaaktypen of these items should be returned,
        # because they are in the review
        review_items = DestructionListItemReviewFactory.create_batch(
            3,
            destruction_list_item__with_zaak=True,
            destruction_list_item__zaak__with_expand=True,
            destruction_list=review.destruction_list,
            review=review,
        )
        # We simulate 2 items having different versions of the same zaaktype
        review_items[0].destruction_list_item.zaak._expand["zaaktype"][
            "identificatie"
        ] = "ZAAKTYPE-1"
        review_items[0].destruction_list_item.zaak.save()
        review_items[1].destruction_list_item.zaak._expand["zaaktype"][
            "identificatie"
        ] = "ZAAKTYPE-1"
        review_items[1].destruction_list_item.zaak.save()
        review_items[2].destruction_list_item.zaak._expand["zaaktype"][
            "identificatie"
        ] = "ZAAKTYPE-2"
        review_items[2].destruction_list_item.zaak.save()

        # These zaaktypen should NOT be returned because they are not in the review
        DestructionListItemReviewFactory.create_batch(
            3,
            destruction_list_item__with_zaak=True,
            destruction_list_item__zaak__with_expand=True,
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-zaaktypen-choices"))
        endpoint.args["review"] = review.pk

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        choices = sorted(response.json(), key=lambda choice: choice["label"])

        self.assertEqual(len(choices), 2)
        self.assertEqual(choices[0]["label"], "ZAAKTYPE-1")
        self.assertEqual(choices[1]["label"], "ZAAKTYPE-2")

        values = choices[0]["value"].split(",")

        self.assertEqual(len(values), 2)
        self.assertIn(review_items[0].destruction_list_item.zaak.zaaktype, values)
        self.assertIn(review_items[1].destruction_list_item.zaak.zaaktype, values)

        self.assertEqual(
            choices[1]["value"], review_items[2].destruction_list_item.zaak.zaaktype
        )


class SelectielijstklasseChoicesViewTests(APITestCase):
    def setUp(self):
        super().setUp()

        self.addCleanup(cache.clear)

    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-selectielijstklasse-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(role__can_start_destruction=False)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-selectielijstklasse-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @Mocker()
    def test_retrieve_choices(self, m):
        ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="http://selectielijst.nl/api/v1",
        )
        user = UserFactory.create(role__can_start_destruction=True)
        zaak = ZaakFactory.create(with_expand=True)
        process_type_url = zaak._expand["zaaktype"]["selectielijst_procestype"]["url"]

        m.get(
            f"http://selectielijst.nl/api/v1/resultaten?procesType={process_type_url}",
            json={
                "count": 3,
                "results": [
                    {
                        "url": "http://selectielijst.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                        "nummer": 1,
                        "volledigNummer": "11.1",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P1Y",
                    },
                    {
                        "url": "http://selectielijst.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                        "nummer": 1,
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P2Y",
                    },
                    {
                        "url": "http://selectielijst.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                        "nummer": 2,
                        "volledigNummer": "11.1.2",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-selectielijstklasse-choices"))
        endpoint.args["zaak"] = zaak.url

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "http://selectielijst.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                    "label": "11.1 - Verleend - vernietigen - P1Y",
                    "detail": {
                        "bewaartermijn": "P1Y",
                    },
                },
                {
                    "value": "http://selectielijst.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                    "label": "1 - Verleend - vernietigen - P2Y",
                    "detail": {
                        "bewaartermijn": "P2Y",
                    },
                },
                {
                    "value": "http://selectielijst.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                    "label": "11.1.2 - Verleend - vernietigen",
                    "detail": {
                        "bewaartermijn": None,
                    },
                },
            ],
        )

    @Mocker()
    def test_response_cached(self, m):
        ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="http://selectielijst.nl/api/v1",
        )
        user = UserFactory.create(role__can_start_destruction=True)
        zaak = ZaakFactory.create(with_expand=True)
        process_type_url = zaak._expand["zaaktype"]["selectielijst_procestype"]["url"]

        m.get(
            f"http://selectielijst.nl/api/v1/resultaten?procesType={process_type_url}",
            json={
                "count": 3,
                "results": [
                    {
                        "url": "http://selectielijst.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                        "nummer": 1,
                        "volledigNummer": "11.1",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P1Y",
                    },
                    {
                        "url": "http://selectielijst.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                        "nummer": 1,
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P2Y",
                    },
                    {
                        "url": "http://selectielijst.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                        "nummer": 2,
                        "volledigNummer": "11.1.2",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-selectielijstklasse-choices"))
        endpoint.args["zaak"] = zaak.url

        self.client.get(endpoint.url)
        self.client.get(endpoint.url)

        self.assertEqual(len(m.request_history), 1)

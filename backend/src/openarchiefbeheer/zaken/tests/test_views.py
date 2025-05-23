from unittest.mock import patch

from django.test import tag
from django.utils.translation import gettext_lazy as _

from furl import furl
from requests_mock import Mocker
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.models import APIConfig
from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
)
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin

from ..tasks import retrieve_and_cache_zaken_from_openzaak
from ..utils import retrieve_paginated_type, retrieve_selectielijstklasse_choices
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


class ZaaktypenChoicesViewsTestCase(ClearCacheMixin, APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-zaaktypen-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_zaaktypen_choices(self):
        user = UserFactory.create()
        ZaakFactory.create(
            post___expand={
                "zaaktype": {
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                    "identificatie": "ZAAKTYPE-01",
                    "omschrijving": "ZAAKTYPE 1.0",
                    "versiedatum": "2024-01-01",
                }
            },
        )
        ZaakFactory.create(
            post___expand={
                "zaaktype": {  # Different version of the zaaktype above
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
                    "identificatie": "ZAAKTYPE-01",
                    "omschrijving": "ZAAKTYPE 1.1",
                    "versiedatum": "2024-01-02",
                }
            },
        )
        ZaakFactory.create(
            post___expand={
                "zaaktype": {
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/333-333-333",
                    "identificatie": "ZAAKTYPE-02",
                    "omschrijving": "ZAAKTYPE 2.0",
                    "versiedatum": "2024-01-01",
                }
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaaktypen-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            sorted(response.json(), key=lambda choice: choice["label"]),
            [
                {
                    "value": "ZAAKTYPE-01",
                    "label": "ZAAKTYPE 1.1 (ZAAKTYPE-01)",
                },
                {
                    "value": "ZAAKTYPE-02",
                    "label": "ZAAKTYPE 2.0 (ZAAKTYPE-02)",
                },
            ],
        )

    def test_retrieve_zaaktypen_choices_empty_identificatie(self):
        user = UserFactory.create()
        ZaakFactory.create(
            post___expand={
                "zaaktype": {
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                    "identificatie": "",
                    "omschrijving": "ZAAKTYPE 1.0",
                    "versiedatum": "2024-01-01",
                }
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaaktypen-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json()[0]["label"], _("ZAAKTYPE 1.0 (no identificatie)")
        )

    def test_response_cached(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:retrieve-zaaktypen-choices")

        with patch(
            "openarchiefbeheer.zaken.api.views.format_zaaktype_choices", return_value=[]
        ) as m:
            self.client.get(endpoint)
            self.client.get(endpoint)

        m.assert_called_once()

    def test_retrieve_zaaktypen_choices_for_destruction_list(self):
        user = UserFactory.create()

        destruction_list = DestructionListFactory.create()
        # The zaaktypen of these items should be returned,
        # because they are in the destruction list with status 'suggested'
        items_in_list = DestructionListItemFactory.create_batch(
            3,
            with_zaak=True,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        # We simulate 2 items having different versions of the same zaaktype
        items_in_list[0].zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
            "identificatie": "ZAAKTYPE-1",
            "omschrijving": "ZAAKTYPE 1.0",
            "versiedatum": "2024-01-01",
        }
        items_in_list[0].zaak.save()
        items_in_list[1].zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-222",
            "identificatie": "ZAAKTYPE-1",
            "omschrijving": "ZAAKTYPE 1.1",
            "versiedatum": "2024-01-02",
        }
        items_in_list[1].zaak.save()
        items_in_list[2].zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
            "identificatie": "ZAAKTYPE-2",
            "omschrijving": "ZAAKTYPE 2.0",
            "versiedatum": "2024-01-01",
        }
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
        url = reverse("api:retrieve-zaaktypen-choices")

        with self.subTest("with GET"):
            endpoint = furl(url)
            endpoint.args["in_destruction_list"] = destruction_list.uuid

            response = self.client.get(endpoint.url)

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            choices = sorted(response.json(), key=lambda choice: choice["label"])

            self.assertEqual(len(choices), 2)
            self.assertEqual(choices[0]["label"], "ZAAKTYPE 1.1 (ZAAKTYPE-1)")
            self.assertEqual(choices[1]["label"], "ZAAKTYPE 2.0 (ZAAKTYPE-2)")
            self.assertEqual("ZAAKTYPE-1", choices[0]["value"])
            self.assertEqual("ZAAKTYPE-2", choices[1]["value"])

        with self.subTest("with POST"):
            response = self.client.post(
                url, data={"in_destruction_list": destruction_list.uuid}
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)

            choices = sorted(response.json(), key=lambda choice: choice["label"])

            self.assertEqual(len(choices), 2)
            self.assertEqual(choices[0]["label"], "ZAAKTYPE 1.1 (ZAAKTYPE-1)")
            self.assertEqual(choices[1]["label"], "ZAAKTYPE 2.0 (ZAAKTYPE-2)")
            self.assertEqual("ZAAKTYPE-1", choices[0]["value"])
            self.assertEqual("ZAAKTYPE-2", choices[1]["value"])

    @tag("gh-303")
    def test_retrieve_zaaktypen_choices_for_destruction_list_if_zaaktype_id_empty(self):
        user = UserFactory.create()

        item = DestructionListItemFactory.create(
            with_zaak=True,
            status=ListItemStatus.suggested,
        )
        item.zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
            "identificatie": "",
            "omschrijving": "ZAAKTYPE 1.0",
            "versiedatum": "2024-01-01",
        }
        item.zaak.save()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-zaaktypen-choices"))
        endpoint.args["in_destruction_list"] = item.destruction_list.uuid

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        choices = response.json()

        self.assertEqual(choices[0]["label"], _("ZAAKTYPE 1.0 (no identificatie)"))
        self.assertEqual(choices[0]["value"], "")

    def test_not_cached_if_query_param_chages(self):
        user = UserFactory.create()

        destruction_list = DestructionListFactory.create()

        items_in_list = DestructionListItemFactory.create_batch(
            2,
            with_zaak=True,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        items_in_list[0].zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
            "identificatie": "ZAAKTYPE-1",
            "omschrijving": "ZAAKTYPE 1.0",
            "versiedatum": "2024-01-01",
        }
        items_in_list[0].zaak.save()
        items_in_list[1].zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
            "identificatie": "ZAAKTYPE-2",
            "omschrijving": "ZAAKTYPE 2.0",
            "versiedatum": "2024-01-02",
        }
        items_in_list[1].zaak.save()

        ZaakFactory.create(
            post___expand={
                "zaaktype": {
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/333-333-333",
                    "identificatie": "ZAAKTYPE-3",
                    "omschrijving": "ZAAKTYPE 3.0",
                    "versiedatum": "2024-01-02",
                }
            },
        )
        ZaakFactory.create(
            post___expand={
                "zaaktype": {
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/444-444-444",
                    "identificatie": "ZAAKTYPE-4",
                    "omschrijving": "ZAAKTYPE 4.0",
                    "versiedatum": "2024-01-02",
                }
            },
        )
        ZaakFactory.create(
            post___expand={
                "zaaktype": {
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/555-555-555",
                    "identificatie": "ZAAKTYPE-5",
                    "omschrijving": "ZAAKTYPE 5.0",
                    "versiedatum": "2024-01-02",
                }
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-zaaktypen-choices"))
        endpoint.args["in_destruction_list"] = destruction_list.uuid

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

        del endpoint.args["in_destruction_list"]
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 5)

    def test_retrieve_zaaktypen_choices_for_review(self):
        user = UserFactory.create()

        review = DestructionListReviewFactory.create()
        # The zaaktypen of these items should be returned,
        # because they are in the review
        review_items = DestructionListItemReviewFactory.create_batch(
            3,
            destruction_list_item__with_zaak=True,
            destruction_list=review.destruction_list,
            review=review,
        )
        # We simulate 2 items having different versions of the same zaaktype
        review_items[0].destruction_list_item.zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
            "identificatie": "ZAAKTYPE-1",
            "omschrijving": "ZAAKTYPE 1.0",
            "versiedatum": "2024-01-01",
        }
        review_items[0].destruction_list_item.zaak.save()
        review_items[1].destruction_list_item.zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-222",
            "identificatie": "ZAAKTYPE-1",
            "omschrijving": "ZAAKTYPE 1.1",
            "versiedatum": "2024-01-02",
        }
        review_items[1].destruction_list_item.zaak.save()
        review_items[2].destruction_list_item.zaak._expand["zaaktype"] = {
            "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
            "identificatie": "ZAAKTYPE-2",
            "omschrijving": "ZAAKTYPE 2.0",
            "versiedatum": "2024-01-01",
        }
        review_items[2].destruction_list_item.zaak.save()

        # These zaaktypen should NOT be returned because they are not in the review
        DestructionListItemReviewFactory.create_batch(
            3,
            destruction_list_item__with_zaak=True,
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-zaaktypen-choices"))
        endpoint.args["in_review"] = review.pk

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        choices = sorted(response.json(), key=lambda choice: choice["label"])

        self.assertEqual(len(choices), 2)
        self.assertEqual(choices[0]["label"], "ZAAKTYPE 1.1 (ZAAKTYPE-1)")
        self.assertEqual(choices[1]["label"], "ZAAKTYPE 2.0 (ZAAKTYPE-2)")

        self.assertEqual("ZAAKTYPE-1", choices[0]["value"])
        self.assertEqual("ZAAKTYPE-2", choices[1]["value"])

    def test_retrieve_zaaktypen_choices_invalid_filters(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-zaaktypen-choices"))
        endpoint.args["in_destruction_list"] = "invalid-uuid"

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["inDestructionList"][0], _("Enter a valid UUID.")
        )

    def test_retrieve_zaaktypen_choices_not_in_destruction_list_except(self):
        user = UserFactory.create()

        ZaakFactory.create()

        destruction_list = DestructionListFactory.create()

        self.client.force_authenticate(user=user)
        url = reverse("api:retrieve-zaaktypen-choices")

        response = self.client.post(
            url, data={"not_in_destruction_list_except": destruction_list.uuid}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class SelectielijstklasseChoicesViewTests(ClearCacheMixin, APITestCase):

    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-selectielijstklasse-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @Mocker()
    def test_retrieve_choices(self, m):
        selectielist_service = ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1",
        )
        user = UserFactory.create(post__can_start_destruction=True)
        zaak = ZaakFactory.create()
        process_type_url = zaak._expand["zaaktype"]["selectielijst_procestype"]["url"]

        m.get(
            "https://selectielijst.openzaak.nl/api/v1/procestypen",
            json=[
                {
                    "url": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    "nummer": 11,
                    "jaar": 2020,
                    "naam": "Toestemming verlenen",
                    "omschrijving": "Het door het orgaan behandelen van een aanvraag, melding of verzoek om toestemming voor het doen of laten van een derde waar het orgaan bevoegd is om over te beslissen",
                    "toelichting": "",
                    "procesobject": "De verleende toestemming",
                },
            ],
        )
        m.get(
            f"https://selectielijst.openzaak.nl/api/v1/resultaten?procesType={process_type_url}",
            json={
                "count": 3,
                "results": [
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                        "nummer": 1,
                        "volledigNummer": "11.1",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P1Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                        "nummer": 1,
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P2Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                        "nummer": 2,
                        "volledigNummer": "11.1.2",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-selectielijstklasse-choices"))
        endpoint.args["zaak"] = zaak.url

        with patch(
            "openarchiefbeheer.zaken.utils.APIConfig.get_solo",
            return_value=APIConfig(selectielijst_api_service=selectielist_service),
        ):
            response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                    "label": "11.1 - Verleend - vernietigen - P1Y (2020)",
                    "extraData": {
                        "bewaartermijn": "P1Y",
                    },
                },
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                    "label": "1 - Verleend - vernietigen - P2Y (2020)",
                    "extraData": {
                        "bewaartermijn": "P2Y",
                    },
                },
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                    "label": "11.1.2 - Verleend - vernietigen (2020)",
                    "extraData": {
                        "bewaartermijn": None,
                    },
                },
            ],
        )

    @Mocker()
    def test_retrieve_choices_without_zaak(self, m):
        selectielist_service = ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1",
        )

        user = UserFactory.create(post__can_start_destruction=True)

        m.get(
            "https://selectielijst.openzaak.nl/api/v1/procestypen",
            json=[
                {
                    "url": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    "nummer": 11,
                    "jaar": 2020,
                    "naam": "Toestemming verlenen",
                    "omschrijving": "Het door het orgaan behandelen van een aanvraag, melding of verzoek om toestemming voor het doen of laten van een derde waar het orgaan bevoegd is om over te beslissen",
                    "toelichting": "",
                    "procesobject": "De verleende toestemming",
                },
            ],
        )
        m.get(
            "https://selectielijst.openzaak.nl/api/v1/resultaten",
            json={
                "count": 3,
                "results": [
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                        "nummer": 1,
                        "volledigNummer": "11.1",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P1Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                        "nummer": 1,
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P2Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                        "nummer": 2,
                        "volledigNummer": "11.1.2",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                ],
            },
        )

        # Authenticate the user
        self.client.force_authenticate(user=user)

        # Build the endpoint without adding the "zaak" parameter
        endpoint = furl(reverse("api:retrieve-selectielijstklasse-choices"))

        # Send the GET request
        with patch(
            "openarchiefbeheer.zaken.utils.APIConfig.get_solo",
            return_value=APIConfig(selectielijst_api_service=selectielist_service),
        ):
            response = self.client.get(endpoint.url)

        # Validate the response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                    "label": "11.1 - Verleend - vernietigen - P1Y (2020)",
                    "extraData": {
                        "bewaartermijn": "P1Y",
                    },
                },
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                    "label": "1 - Verleend - vernietigen - P2Y (2020)",
                    "extraData": {
                        "bewaartermijn": "P2Y",
                    },
                },
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                    "label": "11.1.2 - Verleend - vernietigen (2020)",
                    "extraData": {
                        "bewaartermijn": None,
                    },
                },
            ],
        )

    @Mocker()
    def test_response_cached(self, m):
        selectielist_service = ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1",
        )
        user = UserFactory.create(post__can_start_destruction=True)
        zaak = ZaakFactory.create()
        process_type_url = zaak._expand["zaaktype"]["selectielijst_procestype"]["url"]

        m.get(
            "https://selectielijst.openzaak.nl/api/v1/procestypen",
            json=[
                {
                    "url": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    "nummer": 11,
                    "jaar": 2020,
                    "naam": "Toestemming verlenen",
                    "omschrijving": "Het door het orgaan behandelen van een aanvraag, melding of verzoek om toestemming voor het doen of laten van een derde waar het orgaan bevoegd is om over te beslissen",
                    "toelichting": "",
                    "procesobject": "De verleende toestemming",
                },
            ],
        )
        m.get(
            f"https://selectielijst.openzaak.nl/api/v1/resultaten?procesType={process_type_url}",
            json={
                "count": 3,
                "results": [
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                        "nummer": 1,
                        "volledigNummer": "11.1",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P1Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                        "nummer": 1,
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P2Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                        "nummer": 2,
                        "volledigNummer": "11.1.2",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-selectielijstklasse-choices"))
        endpoint.args["zaak"] = zaak.url

        with patch(
            "openarchiefbeheer.zaken.utils.APIConfig.get_solo",
            return_value=APIConfig(selectielijst_api_service=selectielist_service),
        ):
            self.client.get(endpoint.url)
            self.client.get(endpoint.url)

        # One request for the selectielijstklasse, one for the processtypen
        self.assertEqual(len(m.request_history), 2)


class InternalSelectielijstklasseChoicesViewTests(ClearCacheMixin, APITestCase):
    def setUp(self):
        super().setUp()

        retrieve_selectielijstklasse_choices.cache_clear()

        self.addCleanup(retrieve_selectielijstklasse_choices.cache_clear)

    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-internal-selectielijstklasse-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @Mocker()
    def test_retrieve_internal_choices(self, m):
        """
        Test that only the selectielijstklassen of the zaken in the database are returned.

        We have:

        - A zaak with selectielijstklasse specified on the zaak
        - A zaak with selectielijstklasse derived from resultaat -> resultaattype -> selectielijstklasse
        - A zaak without selectielijstklasse

        We mock the selectielijstklasse API endpoint to return 3 resultaten, two of which are referenced in the zaken
        in the db. So the internal selectielijstklasse choices endpoint should only return 2 choices.
        """
        selectielist_service = ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1",
        )
        user = UserFactory.create(post__can_start_destruction=True)
        ZaakFactory.create(
            selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
            post___expand={
                "resultaat": {
                    "url": "http://localhost:8003/zaken/api/v1/resultaten/821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "uuid": "821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://localhost:8003/catalogi/api/v1/resultaattypen/111-111-111",
                            "omschrijving": "Afgehandeld",
                            "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                        }
                    },
                    "toelichting": "Testing resultaten",
                    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/111-111-111",
                }
            },
        )
        ZaakFactory.create(
            selectielijstklasse="",
            post___expand={
                "resultaat": {
                    "url": "http://localhost:8003/zaken/api/v1/resultaten/821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "uuid": "821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://localhost:8003/catalogi/api/v1/resultaattypen/222-222-222",
                            "omschrijving": "Lopend",
                            "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                        }
                    },
                    "toelichting": "Testing resultaten",
                    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/222-222-222",
                }
            },
        )
        ZaakFactory.create(selectielijstklasse="", post___expand={})

        m.get(
            "https://selectielijst.openzaak.nl/api/v1/procestypen",
            json=[
                {
                    "url": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    "nummer": 11,
                    "jaar": 2020,
                    "naam": "Toestemming verlenen",
                    "omschrijving": "Het door het orgaan behandelen van een aanvraag, melding of verzoek om toestemming voor het doen of laten van een derde waar het orgaan bevoegd is om over te beslissen",
                    "toelichting": "",
                    "procesobject": "De verleende toestemming",
                },
            ],
        )
        m.get(
            "https://selectielijst.openzaak.nl/api/v1/resultaten",
            json={
                "count": 3,
                "results": [
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                        "nummer": 1,
                        "volledigNummer": "11.1",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P1Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                        "nummer": 1,
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P2Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                        "nummer": 2,
                        "volledigNummer": "11.1.2",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-internal-selectielijstklasse-choices"))

        with patch(
            "openarchiefbeheer.zaken.utils.APIConfig.get_solo",
            return_value=APIConfig(selectielijst_api_service=selectielist_service),
        ):
            response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                    "label": "1 - Verleend - vernietigen - P2Y (2020)",
                    "extraData": {
                        "bewaartermijn": "P2Y",
                    },
                },
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                    "label": "11.1.2 - Verleend - vernietigen (2020)",
                    "extraData": {
                        "bewaartermijn": None,
                    },
                },
            ],
        )

    @Mocker()
    def test_retrieve_internal_choices_with_filters(self, m):
        """
        Test that only the selectielijstklassen of the filtered zaken in the database are returned.
        """
        selectielist_service = ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1",
        )
        user = UserFactory.create(post__can_start_destruction=True)
        ZaakFactory.create(
            identificatie="ZAAK-1",
            selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
        )
        ZaakFactory.create(
            identificatie="ZAAK-2",
            selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
        )

        m.get(
            "https://selectielijst.openzaak.nl/api/v1/procestypen",
            json=[
                {
                    "url": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    "nummer": 11,
                    "jaar": 2020,
                    "naam": "Toestemming verlenen",
                    "omschrijving": "Het door het orgaan behandelen van een aanvraag, melding of verzoek om toestemming voor het doen of laten van een derde waar het orgaan bevoegd is om over te beslissen",
                    "toelichting": "",
                    "procesobject": "De verleende toestemming",
                },
            ],
        )
        m.get(
            "https://selectielijst.openzaak.nl/api/v1/resultaten",
            json={
                "count": 3,
                "results": [
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/2e86a8ca-0269-446c-8da2-6f4d08be422d",
                        "nummer": 1,
                        "volledigNummer": "11.1",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P1Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                        "nummer": 1,
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "bewaartermijn": "P2Y",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    {
                        "url": "https://selectielijst.openzaak.nl/api/v1/resultaten/5d102cc6-4a74-4262-a14a-538bbfe3f2da",
                        "nummer": 2,
                        "volledigNummer": "11.1.2",
                        "naam": "Verleend",
                        "waardering": "vernietigen",
                        "procesType": "https://selectielijst.openzaak.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-internal-selectielijstklasse-choices"))
        endpoint.args["identificatie"] = "ZAAK-1"

        with patch(
            "openarchiefbeheer.zaken.utils.APIConfig.get_solo",
            return_value=APIConfig(selectielijst_api_service=selectielist_service),
        ):
            response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/5038528b-0eb7-4502-a415-a3093987d69b",
                    "label": "1 - Verleend - vernietigen - P2Y (2020)",
                    "extraData": {
                        "bewaartermijn": "P2Y",
                    },
                }
            ],
        )

    def test_cache_cleared_after_update(self):
        ServiceFactory.create(
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1",
        )
        user = UserFactory.create(post__can_start_destruction=True)
        zaak1 = ZaakFactory.create(
            selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/111-111-111",
        )
        zaak2 = ZaakFactory.create(
            selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/222-222-222",
        )
        destruction_list = DestructionListFactory.create()
        item1 = DestructionListItemFactory.create(
            zaak=zaak1, destruction_list=destruction_list
        )
        DestructionListItemFactory.create(zaak=zaak2, destruction_list=destruction_list)

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:retrieve-internal-selectielijstklasse-choices"))
        endpoint.args["in_destruction_list"] = str(destruction_list.uuid)
        with patch(
            "openarchiefbeheer.zaken.api.views.retrieve_selectielijstklasse_choices",
            return_value=[
                {
                    "label": "Klasse 1",
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/111-111-111",
                },
                {
                    "label": "Klasse 2",
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/222-222-222",
                },
            ],
        ) as m:
            response = self.client.get(endpoint.url)

            self.assertEqual(status.HTTP_200_OK, response.status_code)
            m.assert_called_once()
            self.assertEqual(len(response.json()), 2)

        item1.delete()
        destruction_list.save()

        # After the list update, the cache should be cleared.
        with patch(
            "openarchiefbeheer.zaken.api.views.retrieve_selectielijstklasse_choices",
            return_value=[
                {
                    "label": "Klasse 1",
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/111-111-111",
                },
                {
                    "label": "Klasse 2",
                    "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/222-222-222",
                },
            ],
        ) as m:
            response = self.client.get(endpoint.url)

            self.assertEqual(status.HTTP_200_OK, response.status_code)
            m.assert_called_once()
            self.assertEqual(len(response.json()), 1)


class ResultaattypenChoicesViewTests(ClearCacheMixin, APITestCase):
    def setUp(self):
        super().setUp()

        self.addCleanup(retrieve_paginated_type.cache_clear)

    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-external-resultaattype-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @Mocker()
    def test_retrieve_choices(self, m):
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://oz.nl/api/v1",
        )
        user = UserFactory.create()

        m.get(
            "http://oz.nl/api/v1/resultaattypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://oz.nl/api/v1/resultaattypen/111-111-111",
                        "omschrijving": "Blabla 1",
                    },
                    {
                        "url": "http://oz.nl/api/v1/resultaattypen/222-222-222",
                        "omschrijving": "",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse("api:retrieve-external-resultaattype-choices")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "http://oz.nl/api/v1/resultaattypen/111-111-111",
                    "label": "Blabla 1",
                },
                {
                    "value": "http://oz.nl/api/v1/resultaattypen/222-222-222",
                    "label": "http://oz.nl/api/v1/resultaattypen/222-222-222",
                },
            ],
        )

    @Mocker()
    def test_retrieve_choices_caches_request(self, m):
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://oz.nl/api/v1",
        )
        user = UserFactory.create()

        m.get(
            "http://oz.nl/api/v1/resultaattypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://oz.nl/api/v1/resultaattypen/111-111-111",
                        "omschrijving": "Blabla 1",
                    },
                    {
                        "url": "http://oz.nl/api/v1/resultaattypen/222-222-222",
                        "omschrijving": "",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse("api:retrieve-external-resultaattype-choices")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Repeat request
        response = self.client.get(
            reverse("api:retrieve-external-resultaattype-choices")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Only one call to openzaak
        self.assertEqual(len(m.request_history), 1)


class InformatieobjecttypenChoicesViewTests(ClearCacheMixin, APITestCase):
    def setUp(self):
        super().setUp()

        self.addCleanup(retrieve_paginated_type.cache_clear)

    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-informatieobjecttype-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @Mocker()
    def test_retrieve_choices(self, m):
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://oz.nl/api/v1",
        )
        user = UserFactory.create()

        m.get(
            "http://oz.nl/api/v1/informatieobjecttypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://oz.nl/api/v1/informatieobjecttypen/111-111-111",
                        "omschrijving": "Blabla 1",
                    },
                    {
                        "url": "http://oz.nl/api/v1/informatieobjecttypen/222-222-222",
                        "omschrijving": "",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:retrieve-informatieobjecttype-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "http://oz.nl/api/v1/informatieobjecttypen/111-111-111",
                    "label": "Blabla 1",
                },
                {
                    "value": "http://oz.nl/api/v1/informatieobjecttypen/222-222-222",
                    "label": "http://oz.nl/api/v1/informatieobjecttypen/222-222-222",
                },
            ],
        )

    @Mocker()
    def test_retrieve_choices_caches_request(self, m):
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://oz.nl/api/v1",
        )
        user = UserFactory.create()

        m.get(
            "http://oz.nl/api/v1/informatieobjecttypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://oz.nl/api/v1/informatieobjecttypen/111-111-111",
                        "omschrijving": "Blabla 1",
                    },
                    {
                        "url": "http://oz.nl/api/v1/informatieobjecttypen/222-222-222",
                        "omschrijving": "",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:retrieve-informatieobjecttype-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Repeat request
        response = self.client.get(reverse("api:retrieve-informatieobjecttype-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Only one call to openzaak
        self.assertEqual(len(m.request_history), 1)


class StatustypenChoicesViewTests(ClearCacheMixin, APITestCase):
    def setUp(self):
        super().setUp()

        self.addCleanup(retrieve_paginated_type.cache_clear)

    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-statustype-choices")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @Mocker()
    def test_retrieve_choices(self, m):
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://oz.nl/api/v1",
        )
        user = UserFactory.create()

        m.get(
            "http://oz.nl/api/v1/statustypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://oz.nl/api/v1/statustypen/111-111-111",
                        "omschrijving": "Blabla 1",
                    },
                    {
                        "url": "http://oz.nl/api/v1/statustypen/222-222-222",
                        "omschrijving": "",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:retrieve-statustype-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "value": "http://oz.nl/api/v1/statustypen/111-111-111",
                    "label": "Blabla 1",
                },
                {
                    "value": "http://oz.nl/api/v1/statustypen/222-222-222",
                    "label": "http://oz.nl/api/v1/statustypen/222-222-222",
                },
            ],
        )

    @Mocker()
    def test_retrieve_choices_caches_request(self, m):
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://oz.nl/api/v1",
        )
        user = UserFactory.create()

        m.get(
            "http://oz.nl/api/v1/statustypen",
            json={
                "count": 2,
                "results": [
                    {
                        "url": "http://oz.nl/api/v1/statustypen/111-111-111",
                        "omschrijving": "Blabla 1",
                    },
                    {
                        "url": "http://oz.nl/api/v1/statustypen/222-222-222",
                        "omschrijving": "",
                    },
                ],
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:retrieve-statustype-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Repeat request
        response = self.client.get(reverse("api:retrieve-statustype-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Only one call to openzaak
        self.assertEqual(len(m.request_history), 1)


class InternalResultaattypeChoicesViewTest(ClearCacheMixin, APITestCase):

    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-internal-resultaattype-choices")
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_all_choices(self):
        user = UserFactory.create()

        ZaakFactory.create(
            post___expand={
                "resultaat": {
                    "url": "http://localhost:8003/zaken/api/v1/resultaten/821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "uuid": "821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://localhost:8003/catalogi/api/v1/resultaattypen/111-111-111",
                            "omschrijving": "Afgehandeld",
                        }
                    },
                    "toelichting": "Testing resultaten",
                    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/111-111-111",
                }
            },
        )
        ZaakFactory.create(
            post___expand={
                "resultaat": {
                    "url": "http://localhost:8003/zaken/api/v1/resultaten/821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "uuid": "821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://localhost:8003/catalogi/api/v1/resultaattypen/222-222-222",
                            "omschrijving": "Lopend",
                        }
                    },
                    "toelichting": "Testing resultaten",
                    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/222-222-222",
                }
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse("api:retrieve-internal-resultaattype-choices")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)
        self.assertEqual(
            [
                {
                    "value": "http://localhost:8003/catalogi/api/v1/resultaattypen/111-111-111",
                    "label": "Afgehandeld",
                },
                {
                    "value": "http://localhost:8003/catalogi/api/v1/resultaattypen/222-222-222",
                    "label": "Lopend",
                },
            ],
            sorted(data, key=lambda choice: choice["value"]),
        )

    def test_get_choices_with_filters(self):
        user = UserFactory.create()

        ZaakFactory.create(
            identificatie="ZAAK-01",
            post___expand={
                "resultaat": {
                    "url": "http://localhost:8003/zaken/api/v1/resultaten/821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "uuid": "821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://localhost:8003/catalogi/api/v1/resultaattypen/111-111-111",
                            "omschrijving": "Afgehandeld",
                        }
                    },
                    "toelichting": "Testing resultaten",
                    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/111-111-111",
                }
            },
        )
        ZaakFactory.create(
            identificatie="ZAAK-02",
            post___expand={
                "resultaat": {
                    "url": "http://localhost:8003/zaken/api/v1/resultaten/821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "uuid": "821b4d8f-3244-4ece-8d33-791fa6d2a2f3",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://localhost:8003/catalogi/api/v1/resultaattypen/222-222-222",
                            "omschrijving": "Lopend",
                        }
                    },
                    "toelichting": "Testing resultaten",
                    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/222-222-222",
                }
            },
        )

        self.client.force_authenticate(user=user)

        endpoint = furl(reverse("api:retrieve-internal-resultaattype-choices"))
        endpoint.args["identificatie"] = "ZAAK-01"

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(
            [
                {
                    "value": "http://localhost:8003/catalogi/api/v1/resultaattypen/111-111-111",
                    "label": "Afgehandeld",
                },
            ],
            data,
        )


class BehandelendAfdelingInternalChoicesViewTests(ClearCacheMixin, APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:retrieve-behandelend-afdeling-choices")
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_all_choices(self):
        user = UserFactory.create()

        ZaakFactory.create(
            post___expand={
                "rollen": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/111-111-111",
                        "betrokkene_type": "organisatorische_eenheid",
                        "omschrijving": "Maykin Support Afdeling",
                    },
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/222-222-222",
                        "betrokkene_type": "organisatorische_eenheid",
                        "omschrijving": "Maykin Dev Afdeling",
                    },
                ]
            },
        )
        ZaakFactory.create(
            post___expand={
                "rollen": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/333-333-333",
                        "betrokkene_type": "organisatorische_eenheid",
                        "omschrijving": "Maykin Design Afdeling",
                    },
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/444-444-444",
                        "betrokkene_type": "vestiging",
                        "omschrijving": "Kantoor",
                    },
                ]
            },
        )
        ZaakFactory.create(
            post___expand={
                "rollen": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/444-444-444",
                        "betrokkene_type": "vestiging",
                        "omschrijving": "Kantoor",
                    }
                ]
            },
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:retrieve-behandelend-afdeling-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 3)
        self.assertEqual(
            sorted(data, key=lambda choice: choice["value"]),
            [
                {
                    "value": "http://localhost:8003/zaken/api/v1/rollen/111-111-111",
                    "label": "Maykin Support Afdeling",
                },
                {
                    "value": "http://localhost:8003/zaken/api/v1/rollen/222-222-222",
                    "label": "Maykin Dev Afdeling",
                },
                {
                    "value": "http://localhost:8003/zaken/api/v1/rollen/333-333-333",
                    "label": "Maykin Design Afdeling",
                },
            ],
        )

    def test_get_choices_with_filters(self):
        user = UserFactory.create()

        ZaakFactory.create(
            identificatie="ZAAK-01",
            post___expand={
                "rollen": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/111-111-111",
                        "betrokkene_type": "organisatorische_eenheid",
                        "omschrijving": "Maykin Support Afdeling",
                    },
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/222-222-222",
                        "betrokkene_type": "organisatorische_eenheid",
                        "omschrijving": "Maykin Dev Afdeling",
                    },
                ]
            },
        )
        ZaakFactory.create(
            identificatie="ZAAK-02",
            post___expand={
                "rollen": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/333-333-333",
                        "betrokkene_type": "organisatorische_eenheid",
                        "omschrijving": "Maykin Design Afdeling",
                    },
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/444-444-444",
                        "betrokkene_type": "vestiging",
                        "omschrijving": "Kantoor",
                    },
                ]
            },
        )
        ZaakFactory.create(
            identificatie="ZAAK-03",
            post___expand={
                "rollen": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/rollen/444-444-444",
                        "betrokkene_type": "vestiging",
                        "omschrijving": "Kantoor",
                    }
                ]
            },
        )

        self.client.force_authenticate(user=user)

        endpoint = furl(reverse("api:retrieve-behandelend-afdeling-choices"))
        endpoint.args["identificatie"] = "ZAAK-01"

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)
        self.assertEqual(
            sorted(data, key=lambda choice: choice["value"]),
            [
                {
                    "value": "http://localhost:8003/zaken/api/v1/rollen/111-111-111",
                    "label": "Maykin Support Afdeling",
                },
                {
                    "value": "http://localhost:8003/zaken/api/v1/rollen/222-222-222",
                    "label": "Maykin Dev Afdeling",
                },
            ],
        )


class ClearChoicesEndpointsTests(ClearCacheMixin, APITestCase):
    def test_not_authenticated(self):
        response = self.client.post(reverse("api:clear-choices-endpoints-cache"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cache_is_cleared(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)

        with patch(
            "openarchiefbeheer.zaken.api.views.retrieve_zaaktypen", return_value=[]
        ) as m:
            response = self.client.get(
                reverse("api:retrieve-external-zaaktypen-choices")
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            response = self.client.post(reverse("api:clear-choices-endpoints-cache"))
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            response = self.client.get(
                reverse("api:retrieve-external-zaaktypen-choices")
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            self.assertEqual(m.call_count, 2)

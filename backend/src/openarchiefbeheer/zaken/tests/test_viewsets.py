from django.test import tag

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import InternalStatus, ListItemStatus
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
)

from .factories import ZaakFactory


class ZakenViewSetTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:zaken-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(
            post__can_start_destruction=False,
            post__can_review_destruction=False,
            post__can_co_review_destruction=False,
        )

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:zaken-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_all_zaken_as_record_manager(self):
        ZaakFactory.create_batch(4)

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        self.client.force_authenticate(user)
        response = self.client.get(reverse("api:zaken-list"))
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

    def test_retrieve_all_zaken_as_reviewer(self):
        ZaakFactory.create_batch(4)

        user = UserFactory(username="reviewer", post__can_review_destruction=True)

        self.client.force_authenticate(user)
        response = self.client.get(reverse("api:zaken-list"))
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

    def test_retrieve_all_zaken_as_co_reviewer(self):
        ZaakFactory.create_batch(4)

        user = UserFactory(username="co-reviewer", post__can_co_review_destruction=True)

        self.client.force_authenticate(user)
        response = self.client.get(reverse("api:zaken-list"))
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

    @tag("gh-328")
    def test_retrieve_all_zaken_with_removed_zaken(self):
        ZaakFactory.create_batch(5)
        # A deleted item
        DestructionListItemFactory.create(
            zaak=None,
            status=ListItemStatus.suggested,
            processing_status=InternalStatus.succeeded,
        )

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        self.client.force_authenticate(user)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["not_in_destruction_list"] = True
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 5)

    @tag("gh-339")
    def test_filter_zaken_with_removed_zaken(self):
        zaken_in_list = ZaakFactory.create_batch(5)
        ZaakFactory.create_batch(5)
        # A deleted item
        DestructionListItemFactory.create(
            zaak=None,
            status=ListItemStatus.suggested,
            processing_status=InternalStatus.succeeded,
        )
        destruction_list = DestructionListFactory.create()
        for zaak in zaken_in_list:
            DestructionListItemFactory.create(
                destruction_list=destruction_list, zaak=zaak
            )

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        self.client.force_authenticate(user)
        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["not_in_destruction_list_except"] = str(destruction_list.uuid)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 10)

    def test_filter_zaken_on_resultaat(self):
        zaken = ZaakFactory.create_batch(3)
        zaken[0]._expand.update(
            {
                "resultaat": {
                    "url": "http://localhost:8003/zaken/api/v1/resultaten/c81e0154-7d0f-4f1f-9264-06c45127d6a4",
                    "uuid": "c81e0154-7d0f-4f1f-9264-06c45127d6a4",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://localhost:8003/catalogi/api/v1/resultaattypen/7759dcb7-de9a-4543-99e3-81472c488f32",
                            "resultaattypeomschrijving": "Lopend",
                        }
                    },
                    "toelichting": "Testing resultaattype",
                    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/7759dcb7-de9a-4543-99e3-81472c488f32",
                }
            }
        )
        zaken[0].identificatie = "ZAAK-WITH-RESULTAAT"
        zaken[0].save()

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        self.client.force_authenticate(user)
        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["resultaat__resultaattype"] = (
            "http://localhost:8003/catalogi/api/v1/resultaattypen/7759dcb7-de9a-4543-99e3-81472c488f32"
        )
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["identificatie"], "ZAAK-WITH-RESULTAAT")

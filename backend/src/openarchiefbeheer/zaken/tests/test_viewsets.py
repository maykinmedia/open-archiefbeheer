from datetime import date

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory

from .factories import ZaakFactory


class ZakenViewSetTest(APITestCase):

    def test_not_authenticated(self):
        endpoint = reverse("api:zaken-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(role__can_start_destruction=False)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:zaken-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_all_zaken(self):
        ZaakFactory.create_batch(4)

        user = UserFactory(username="record_manager", role__can_start_destruction=True)

        self.client.force_authenticate(user)
        response = self.client.get(reverse("api:zaken-list"))
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

    def test_filter_out_zaken_already_in_destruction_lists(self):
        zaken = ZaakFactory.create_batch(5)

        # This zaak should NOT be returned by the endpoint (it's included in a destruction list)
        DestructionListItemFactory.create(
            status=ListItemStatus.suggested, zaak=zaken[0].url
        )
        # This zaak SHOULD be returned by the endpoint (it was included in a destruction list, but was then excluded)
        DestructionListItemFactory.create(
            status=ListItemStatus.removed, zaak=zaken[1].url
        )

        user = UserFactory(username="record_manager", role__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["not_in_destruction_list"] = "True"

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

        urls_zaken = [zaak["url"] for zaak in data["results"]]

        self.assertNotIn(zaken[0].url, urls_zaken)

    def test_using_query_params_to_filter(self):
        ZaakFactory.create_batch(2, startdatum=date(2020, 1, 1))
        recent_zaken = ZaakFactory.create_batch(3, startdatum=date(2022, 1, 1))

        user = UserFactory(username="record_manager", role__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["startdatum__gt"] = "2021-01-01"

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 3)

        urls_zaken = [zaak["url"] for zaak in data["results"]]

        self.assertIn(recent_zaken[0].url, urls_zaken)
        self.assertIn(recent_zaken[1].url, urls_zaken)

    def test_filter_resultaattype(self):
        zaak_1 = ZaakFactory.create(
            resultaat={
                "resultaattype": {
                    "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111"
                }
            }
        )
        ZaakFactory.create(
            resultaat="http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111"
        )  # Not expanded
        ZaakFactory.create_batch(
            2,
            resultaat={
                "resultaattype": {
                    "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/222-222-222"
                }
            },
        )

        user = UserFactory(username="record_manager", role__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["resultaat__resultaattype__url"] = (
            "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111"
        )

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["uuid"], str(zaak_1.uuid))

    def test_filter_bewaartermijn(self):
        zaak_1 = ZaakFactory.create(
            resultaat={"resultaattype": {"archiefactietermijn": "P1D"}}
        )
        ZaakFactory.create(
            resultaat="http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111"
        )  # Not expanded
        ZaakFactory.create_batch(
            2, resultaat={"resultaattype": {"archiefactietermijn": "P2D"}}
        )

        user = UserFactory(username="record_manager", role__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["bewaartermijn"] = "P1D"

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["uuid"], str(zaak_1.uuid))

    def test_filter_vcs(self):
        zaak_1 = ZaakFactory.create(
            zaaktype={"selectielijst_procestype": {"nummer": 1}}
        )
        ZaakFactory.create(
            zaaktype="http://catalogue-api.nl/zaaktypen/111-111-111",
        )  # Not expanded
        ZaakFactory.create_batch(
            2, zaaktype={"selectielijst_procestype": {"nummer": 2}}
        )

        user = UserFactory(username="record_manager", role__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["vcs"] = 1

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["uuid"], str(zaak_1.uuid))

    def test_filter_heeft_relaties(self):
        zaak_1 = ZaakFactory.create(
            relevante_andere_zaken=[
                "http://zaken-api.nl/zaken/api/v1/zaken/111-111-111"
            ]
        )
        zaak_2 = ZaakFactory.create(
            relevante_andere_zaken=[
                "http://zaken-api.nl/zaken/api/v1/zaken/111-111-111",
                "http://zaken-api.nl/zaken/api/v1/zaken/222-222-222",
            ]
        )
        no_relations_zaken = ZaakFactory.create_batch(2, relevante_andere_zaken=[])

        user = UserFactory(username="record_manager", role__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["heeft_relaties"] = True

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 2)

        uuids = [zaak["uuid"] for zaak in data["results"]]

        self.assertIn(str(zaak_1.uuid), uuids)
        self.assertIn(str(zaak_2.uuid), uuids)

        # If the filter is false, we only want zaken without relations
        endpoint.args["heeft_relaties"] = False
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 2)

        uuids = [zaak["uuid"] for zaak in data["results"]]

        self.assertIn(str(no_relations_zaken[0].uuid), uuids)
        self.assertIn(str(no_relations_zaken[1].uuid), uuids)

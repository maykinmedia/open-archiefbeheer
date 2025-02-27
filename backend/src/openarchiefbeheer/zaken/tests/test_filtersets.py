from datetime import date

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
)

from .factories import ZaakFactory


class FilterZakenTests(APITestCase):
    def test_filter_out_zaken_already_in_destruction_lists(self):
        ZaakFactory.create_batch(3)

        # This zaak should NOT be returned by the endpoint (it's included in a destruction list)
        item_in_destruction_list = DestructionListItemFactory.create(
            status=ListItemStatus.suggested, with_zaak=True
        )
        # This zaak SHOULD be returned by the endpoint (it was included in a destruction list, but was then excluded)
        DestructionListItemFactory.create(status=ListItemStatus.removed, with_zaak=True)

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["not_in_destruction_list"] = "True"

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

        urls_zaken = [zaak["url"] for zaak in data["results"]]

        self.assertNotIn(item_in_destruction_list.zaak.url, urls_zaken)

    def test_using_query_params_to_filter(self):
        ZaakFactory.create_batch(2, startdatum=date(2020, 1, 1))
        recent_zaken = ZaakFactory.create_batch(3, startdatum=date(2022, 1, 1))

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

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
            post___expand={
                "resultaat": {
                    "resultaattype": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111"
                        }
                    },
                }
            }
        )
        ZaakFactory.create_batch(
            2,
            post___expand={
                "resultaat": {
                    "resultaattype": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/222-222-222",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/222-222-222"
                        }
                    },
                }
            },
        )

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["_expand__resultaat__resultaattype"] = (
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
            post___expand={
                "resultaat": {
                    "_expand": {"resultaattype": {"archiefactietermijn": "P1D"}}
                }
            }
        )
        ZaakFactory.create_batch(
            2,
            post___expand={
                "resultaat": {
                    "_expand": {"resultaattype": {"archiefactietermijn": "P2D"}}
                }
            },
        )

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

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
            post___expand={"zaaktype": {"selectielijst_procestype": {"nummer": 1}}}
        )
        ZaakFactory.create_batch(
            2, post___expand={"zaaktype": {"selectielijst_procestype": {"nummer": 2}}}
        )

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

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

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

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

    def test_partial_filter(self):
        ZaakFactory.create(
            identificatie="ZAAK-ABCDEF-01",
            post___expand={"zaaktype": {"omschrijving": "Some other omschrijving"}},
        )
        ZaakFactory.create(
            identificatie="ZAAK-ABC-02",
            post___expand={"zaaktype": {"omschrijving": "Aangifte behandelen"}},
        )
        ZaakFactory.create(
            identificatie="ZAAK-BCDEF-02",
            post___expand={"zaaktype": {"omschrijving": "Aangifte behandelen"}},
        )

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["identificatie__icontains"] = "ABC"
        endpoint.args["zaaktype__omschrijving__icontains"] = "Aangifte behandelen"

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 1)

    def test_filter_out_zaken_already_in_destruction_lists_except_one(self):
        ZaakFactory.create_batch(2)

        # This zaak should NOT be returned by the endpoint (it's included in a destruction list)
        DestructionListItemFactory.create(
            status=ListItemStatus.suggested,
            with_zaak=True,
        )
        # This zaak SHOULD be returned by the endpoint (it was included in a destruction list, but was then excluded)
        DestructionListItemFactory.create(status=ListItemStatus.removed, with_zaak=True)
        # This zaak SHOULD be returned, because it is included in the 'exception' list
        item = DestructionListItemFactory.create(
            status=ListItemStatus.suggested, with_zaak=True
        )

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["not_in_destruction_list_except"] = item.destruction_list.uuid

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 4)

        urls_zaken = [zaak["url"] for zaak in data["results"]]

        # The zaken in the 'exception' list should be returned first
        self.assertEqual(item.zaak.url, urls_zaken[0])

    def test_filter_behandelend_afdeling(self):
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
                        "url": "http://localhost:8003/zaken/api/v1/rollen/111-111-111",
                        "betrokkene_type": "organisatorische_eenheid",
                        "omschrijving": "Maykin Support Afdeling",
                    },
                ]
            },
        )
        ZaakFactory.create(
            identificatie="ZAAK-03",
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
            identificatie="ZAAK-04",
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

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["behandelend_afdeling"] = (
            "http://localhost:8003/zaken/api/v1/rollen/111-111-111"
        )

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 2)

        zaken_returned = [zaak["identificatie"] for zaak in data["results"]]
        self.assertIn("ZAAK-01", zaken_returned)
        self.assertIn("ZAAK-02", zaken_returned)

    def test_ordering(self):
        zaak_2 = ZaakFactory.create(identificatie="ZAAK-0000-0000000002")
        zaak_1 = ZaakFactory.create(identificatie="ZAAK-0000-0000000001")
        zaak_3 = ZaakFactory.create(identificatie="ZAAK-0000-0000000003")

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        self.client.force_authenticate(user)

        endpoint = furl(reverse("api:zaken-list"))
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(data["results"][0]["identificatie"], zaak_2.identificatie)
        self.assertEqual(data["results"][1]["identificatie"], zaak_1.identificatie)
        self.assertEqual(data["results"][2]["identificatie"], zaak_3.identificatie)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["ordering"] = "identificatie"
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(data["results"][0]["identificatie"], zaak_1.identificatie)
        self.assertEqual(data["results"][1]["identificatie"], zaak_2.identificatie)
        self.assertEqual(data["results"][2]["identificatie"], zaak_3.identificatie)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["ordering"] = "-identificatie"
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(data["results"][0]["identificatie"], zaak_3.identificatie)
        self.assertEqual(data["results"][1]["identificatie"], zaak_2.identificatie)
        self.assertEqual(data["results"][2]["identificatie"], zaak_1.identificatie)

    def test_filter_on_destruction_list(self):
        ZaakFactory.create_batch(3)
        destruction_list = DestructionListFactory.create()

        # This zaak SHOULD be returned by the endpoint (it's in the destruction list)
        item = DestructionListItemFactory.create(
            status=ListItemStatus.suggested,
            with_zaak=True,
            destruction_list=destruction_list,
        )
        # This zaak should NOT be returned by the endpoint (it was included in the destruction list, but was excluded)
        DestructionListItemFactory.create(
            status=ListItemStatus.removed,
            with_zaak=True,
            destruction_list=destruction_list,
        )

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["in_destruction_list"] = destruction_list.uuid

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 1)
        self.assertEqual(item.zaak.url, data["results"][0]["url"])

    def test_filter_on_zaaktype(self):
        zaak1 = ZaakFactory.create(
            post___expand={
                "zaaktype": {
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                    "identificatie": "ZAAKTYPE-01",
                    "omschrijving": "ZAAKTYPE 1.0",
                    "versiedatum": "2024-01-01",
                }
            },
        )
        zaak2 = ZaakFactory.create(
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

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        endpoint = furl(reverse("api:zaken-list"))
        endpoint.args["zaaktype"] = "ZAAKTYPE-01"

        self.client.force_authenticate(user)
        response = self.client.get(endpoint.url)
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 2)

        urls_zaken = [zaak["url"] for zaak in data["results"]]

        self.assertIn(zaak1.url, urls_zaken)
        self.assertIn(zaak2.url, urls_zaken)

    def test_filter_on_zaaktype_with_post(self):
        zaak1 = ZaakFactory.create(
            post___expand={
                "zaaktype": {
                    "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                    "identificatie": "ZAAKTYPE-01",
                    "omschrijving": "ZAAKTYPE 1.0",
                    "versiedatum": "2024-01-01",
                }
            },
        )
        zaak2 = ZaakFactory.create(
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

        user = UserFactory(username="record_manager", post__can_start_destruction=True)

        self.client.force_authenticate(user)
        response = self.client.post(
            reverse("api:zaken-search"), data={"zaaktype": "ZAAKTYPE-01"}
        )
        data = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["count"], 2)

        urls_zaken = [zaak["url"] for zaak in data["results"]]

        self.assertIn(zaak1.url, urls_zaken)
        self.assertIn(zaak2.url, urls_zaken)

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import InternalStatus, ListItemStatus
from ..factories import DestructionListFactory, DestructionListItemFactory


class DestructionListItemsViewSetTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:destruction-list-items-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_destruction_list_items(self):
        record_manager = UserFactory.create(username="record_manager")

        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/333-333-333",
            status=ListItemStatus.removed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse("api:destruction-list-items-list")

        response = self.client.get(
            endpoint,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = sorted(response.json()["results"], key=lambda item: item["zaak"]["url"])

        self.assertEqual(
            data[0]["zaak"]["url"],
            "http://zaken.nl/api/v1/zaken/111-111-111",
        )
        self.assertEqual(
            data[1]["zaak"]["url"],
            "http://zaken.nl/api/v1/zaken/222-222-222",
        )
        self.assertEqual(
            data[2]["zaak"]["url"],
            "http://zaken.nl/api/v1/zaken/333-333-333",
        )

    def test_filter_items_on_destruction_list(self):
        record_manager = UserFactory.create(username="record_manager")

        destruction_list = DestructionListFactory.create()
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/333-333-333",
            destruction_list=destruction_list,
            status=ListItemStatus.removed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["item-destruction_list"] = str(destruction_list.uuid)

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["count"], 2)

    def test_filter_items_on_destruction_list_and_status(self):
        record_manager = UserFactory.create(username="record_manager")

        destruction_list = DestructionListFactory.create()
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/333-333-333",
            destruction_list=destruction_list,
            status=ListItemStatus.removed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["item-destruction_list"] = str(destruction_list.uuid)
        endpoint.args["item-status"] = ListItemStatus.suggested

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["count"], 1)

    def test_order_on_processing_status(self):
        record_manager = UserFactory.create(username="record_manager")
        destruction_list = DestructionListFactory.create()
        item1 = DestructionListItemFactory.create(
            status=ListItemStatus.suggested,
            destruction_list=destruction_list,
            processing_status=InternalStatus.succeeded,
            with_zaak=True,
        )
        item2 = DestructionListItemFactory.create(
            status=ListItemStatus.suggested,
            destruction_list=destruction_list,
            processing_status=InternalStatus.processing,
            with_zaak=True,
        )
        item3 = DestructionListItemFactory.create(
            status=ListItemStatus.suggested,
            destruction_list=destruction_list,
            processing_status=InternalStatus.failed,
            with_zaak=True,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["item-destruction_list"] = str(destruction_list.uuid)

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["results"][0]["pk"], item3.pk)
        self.assertEqual(data["results"][1]["pk"], item2.pk)
        self.assertEqual(data["results"][2]["pk"], item1.pk)

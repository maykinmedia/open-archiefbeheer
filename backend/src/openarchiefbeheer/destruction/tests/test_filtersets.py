from datetime import date

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from .factories import (
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
)


class DestructionListItemEndpoint(APITestCase):
    def test_filter_on_non_method_field(self):
        record_manager = UserFactory.create(username="record_manager")
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__bronorganisatie="000000000",
            zaak__startdatum=date(2020, 1, 1),
        )
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__bronorganisatie="000000000",
            zaak__startdatum=date(2020, 1, 2),
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__bronorganisatie="000000001",
            zaak__startdatum=date(2020, 1, 3),
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["bronorganisatie"] = "000000000"
        endpoint.args["startdatum"] = "2020-01-02"

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["pk"], item.pk)

    def test_on_method_field(self):
        record_manager = UserFactory.create(username="record_manager")
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__relevante_andere_zaken=["http://zaken.nl/1", "http://zaken.nl/2"],
        )
        DestructionListItemFactory.create(
            with_zaak=True, zaak__relevante_andere_zaken=[]
        )
        DestructionListItemFactory.create(
            with_zaak=True, zaak__relevante_andere_zaken=[]
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["heeft_relaties"] = True

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["pk"], item.pk)


class DestructionListItemReviewEndpoint(APITestCase):
    def test_filter_on_non_method_field(self):
        record_manager = UserFactory.create(username="record_manager")
        item1 = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__bronorganisatie="000000000",
            zaak__startdatum=date(2020, 1, 1),
        )
        item2 = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__bronorganisatie="000000000",
            zaak__startdatum=date(2020, 1, 2),
        )
        item3 = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__bronorganisatie="000000001",
            zaak__startdatum=date(2020, 1, 3),
        )
        review = DestructionListReviewFactory.create()
        DestructionListItemReviewFactory.create(
            review=review, destruction_list_item=item1
        )
        review_item2 = DestructionListItemReviewFactory.create(
            review=review, destruction_list_item=item2
        )
        DestructionListItemReviewFactory.create(
            review=review, destruction_list_item=item3
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:reviews-items-list"))
        endpoint.args["bronorganisatie"] = "000000000"
        endpoint.args["startdatum"] = "2020-01-02"

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["pk"], review_item2.pk)

    def test_on_method_field(self):
        record_manager = UserFactory.create(username="record_manager")
        item1 = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__relevante_andere_zaken=["http://zaken.nl/1", "http://zaken.nl/2"],
        )
        item2 = DestructionListItemFactory.create(
            with_zaak=True, zaak__relevante_andere_zaken=[]
        )
        item3 = DestructionListItemFactory.create(
            with_zaak=True, zaak__relevante_andere_zaken=[]
        )
        review = DestructionListReviewFactory.create()
        review_item1 = DestructionListItemReviewFactory.create(
            review=review, destruction_list_item=item1
        )
        DestructionListItemReviewFactory.create(
            review=review, destruction_list_item=item2
        )
        DestructionListItemReviewFactory.create(
            review=review, destruction_list_item=item3
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:reviews-items-list"))
        endpoint.args["heeft_relaties"] = True

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["pk"], review_item1.pk)

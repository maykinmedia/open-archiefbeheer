from datetime import date

import requests_mock
from freezegun import freeze_time
from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..constants import ListStatus
from .factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
)


class DestructionListItemEndpoint(APITestCase):
    @requests_mock.Mocker()
    def test_filter_on_non_method_field(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

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

    @requests_mock.Mocker()
    def test_on_method_field(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

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
    @requests_mock.Mocker()
    def test_filter_on_non_method_field(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

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

    @requests_mock.Mocker()
    def test_on_method_field(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

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


class DestructionListEndpoint(APITestCase):
    @requests_mock.Mocker()
    def test_filter_name(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

        DestructionListFactory.create(name="Destruction list A")
        DestructionListFactory.create(name="Destruction list B")

        record_manager = UserFactory.create(post__can_start_destruction=True)
        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destructionlist-list"))
        endpoint.args["name"] = "b"

        response = self.client.get(
            endpoint.url,
        )

        data = response.json()

        names = [list["name"] for list in data["results"]]

        self.assertEqual(
            names,
            ["Destruction list B"],
        )

    @requests_mock.Mocker()
    def test_filter_status(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

        DestructionListFactory.create(name="Destruction list A", status=ListStatus.new)
        DestructionListFactory.create(
            name="Destruction list B", status=ListStatus.ready_to_review
        )

        record_manager = UserFactory.create(post__can_start_destruction=True)
        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destructionlist-list"))
        endpoint.args["status"] = "ready_to_review"

        response = self.client.get(
            endpoint.url,
        )

        data = response.json()

        names = [list["name"] for list in data["results"]]

        self.assertEqual(
            names,
            ["Destruction list B"],
        )

    @requests_mock.Mocker()
    def test_filter_author(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

        user_a = UserFactory.create()
        user_b = UserFactory.create()

        DestructionListFactory.create(name="Destruction list A", author=user_a)
        DestructionListFactory.create(name="Destruction list B", author=user_b)

        record_manager = UserFactory.create(post__can_start_destruction=True)
        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destructionlist-list"))
        endpoint.args["author"] = user_b.pk

        response = self.client.get(
            endpoint.url,
        )

        data = response.json()

        names = [list["name"] for list in data["results"]]

        self.assertEqual(
            names,
            ["Destruction list B"],
        )

    @requests_mock.Mocker()
    def test_filter_reviewer(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

        user_a = UserFactory.create()
        user_b = UserFactory.create()

        destruction_list_a = DestructionListFactory.create(
            name="Destruction list A",
        )
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list_a, user=user_a
        )

        destruction_list_b = DestructionListFactory.create(
            name="Destruction list B",
        )
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list_b, user=user_b
        )

        record_manager = UserFactory.create(post__can_start_destruction=True)
        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destructionlist-list"))
        endpoint.args["reviewer"] = user_b.pk

        response = self.client.get(
            endpoint.url,
        )

        data = response.json()

        names = [list["name"] for list in data["results"]]

        self.assertEqual(
            names,
            ["Destruction list B"],
        )

    @requests_mock.Mocker()
    def test_filter_assignee(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

        user_a = UserFactory.create()
        user_b = UserFactory.create()

        DestructionListFactory.create(name="Destruction list A", assignee=user_a)
        DestructionListFactory.create(name="Destruction list B", assignee=user_b)

        record_manager = UserFactory.create(post__can_start_destruction=True)
        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destructionlist-list"))
        endpoint.args["assignee"] = user_b.pk

        response = self.client.get(
            endpoint.url,
        )

        data = response.json()

        names = [list["name"] for list in data["results"]]

        self.assertEqual(
            names,
            ["Destruction list B"],
        )

    @requests_mock.Mocker()
    def test_ordering_on_creation_date(self, m: requests_mock.Mocker):
        ServiceFactory.create(
            api_root="http://zaken.nl/zaken/api/v1/", api_type=APITypes.zrc
        )
        m.get(
            "http://zaken.nl/zaken/api/v1/zaakobjecten",
            json={"results": []},
        )

        with freeze_time("2024-05-02T16:00:00+02:00"):
            DestructionListFactory.create(name="Destruction list A")
        with freeze_time("2024-08-01T16:30:00+02:00"):
            DestructionListFactory.create(name="Destruction list B")
        with freeze_time("2025-02-05T17:00:00+02:00"):
            DestructionListFactory.create(name="Destruction list C")

        record_manager = UserFactory.create(
            username="record_manager", post__can_start_destruction=True
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destructionlist-list"))
        endpoint.args["ordering"] = "-created"

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        names_in_order = [list["name"] for list in data["results"]]

        self.assertEqual(
            names_in_order,
            ["Destruction list C", "Destruction list B", "Destruction list A"],
        )

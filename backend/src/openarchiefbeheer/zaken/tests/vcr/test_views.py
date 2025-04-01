from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin

from ...utils import retrieve_paginated_type


class StatustypenChoicesViewTests(ClearCacheMixin, VCRMixin, APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

    def setUp(self):
        super().setUp()

        self.addCleanup(retrieve_paginated_type.cache_clear)

    def test_retrieve_all_choices(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:retrieve-statustype-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)

        results = [statustype["value"] for statustype in data]

        self.assertIn(
            "http://localhost:8003/catalogi/api/v1/statustypen/9438e56a-5d78-4dc8-9d9a-2404781f818d",
            results,
        )
        self.assertIn(
            "http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
            results,
        )

    def test_retrieve_choices_with_filters(self):
        user = UserFactory.create()

        endpoint = furl(reverse("api:retrieve-statustype-choices"))
        endpoint.args["zaaktype"] = (
            "http://localhost:8003/catalogi/api/v1/zaaktypen/be210495-20b6-48ff-8d3d-3e44f74c43a4"
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(
            data[0]["value"],
            "http://localhost:8003/catalogi/api/v1/statustypen/9438e56a-5d78-4dc8-9d9a-2404781f818d",
        )


class ResultaattypenChoicesViewTests(ClearCacheMixin, VCRMixin, APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

    def setUp(self):
        super().setUp()

        self.addCleanup(retrieve_paginated_type.cache_clear)

    def test_retrieve_all_choices(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse("api:retrieve-external-resultaattype-choices")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)

        results = [resultaattype["value"] for resultaattype in data]

        self.assertIn(
            "http://localhost:8003/catalogi/api/v1/resultaattypen/12903100-b7a0-4441-9645-eda7df2ad106",
            results,
        )
        self.assertIn(
            "http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
            results,
        )

    def test_retrieve_choices_with_filters(self):
        user = UserFactory.create()

        endpoint = furl(reverse("api:retrieve-external-resultaattype-choices"))
        endpoint.args["zaaktypeIdentificatie"] = "ZAAKTYPE-2018-0000000001"

        self.client.force_authenticate(user=user)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(
            data[0]["value"],
            "http://localhost:8003/catalogi/api/v1/resultaattypen/12903100-b7a0-4441-9645-eda7df2ad106",
        )


class InformatieobjecttypenChoicesViewTests(ClearCacheMixin, VCRMixin, APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

    def setUp(self):
        super().setUp()

        self.addCleanup(retrieve_paginated_type.cache_clear)

    def test_retrieve_all_choices(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:retrieve-informatieobjecttype-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)

        results = [informatieobjecttype["value"] for informatieobjecttype in data]

        self.assertIn(
            "http://localhost:8003/catalogi/api/v1/informatieobjecttypen/a8089bdf-72d3-414f-a9cd-953cfa602b6c",
            results,
        )
        self.assertIn(
            "http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
            results,
        )

    def test_retrieve_choices_with_filters(self):
        user = UserFactory.create()

        endpoint = furl(reverse("api:retrieve-informatieobjecttype-choices"))
        endpoint.args["zaaktypeIdentificatie"] = "ZAAKTYPE-2018-0000000001"

        self.client.force_authenticate(user=user)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(
            data[0]["value"],
            "http://localhost:8003/catalogi/api/v1/informatieobjecttypen/a8089bdf-72d3-414f-a9cd-953cfa602b6c",
        )


class ExternalZaaktypenChoicesViewTests(ClearCacheMixin, VCRMixin, APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

    def setUp(self):
        super().setUp()

        self.addCleanup(retrieve_paginated_type.cache_clear)

    def test_retrieve_all_choices(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:retrieve-external-zaaktypen-choices"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)

        results = [zaaktype["value"] for zaaktype in data]

        self.assertIn(
            "ZAAKTYPE-2018-0000000002",
            results,
        )
        self.assertIn(
            "ZAAKTYPE-2018-0000000001",
            results,
        )

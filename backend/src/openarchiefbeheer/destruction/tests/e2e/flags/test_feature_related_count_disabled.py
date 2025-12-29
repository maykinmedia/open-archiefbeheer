# fmt: off
from django.test import override_settings, tag
from django.urls import reverse

import requests_mock
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import ListStatus
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.utils.utils_decorators import AsyncCapableRequestsMock


@tag("e2e")
@tag("flag")
@tag("gh-943")
class FlagFeatureRelatedCountDisabledTests(APITestCase):
    @override_settings(FEATURE_RELATED_COUNT_DISABLED=False)
    def test_feature_related_count_disabled_false(self):
        with requests_mock.Mocker() as m:
            m.get(
                "http://zaken.nl/zaken/api/v1/zaakobjecten",
                json={"results": []},
            )

            user = UserFactory.create()
            self.client.force_authenticate(user=user)
            destruction_list_item = DestructionListItemFactory.create()
            endpoint = reverse(
                "api:destruction-list-items-detail",
                kwargs={"pk": destruction_list_item.pk},
            )
            response = self.client.get(endpoint)
            content = response.json()

            self.assertEqual(content["supportedRelatedObjectsCount"], 0)
            self.assertEqual(content["selectedRelatedObjectsCount"], 0)

    @override_settings(FEATURE_RELATED_COUNT_DISABLED=True)
    def test_feature_related_count_disabled_true(self):
        user = UserFactory.create()
        self.client.force_authenticate(user=user)
        destruction_list_item = DestructionListItemFactory.create()
        endpoint = reverse(
            "api:destruction-list-items-detail",
            kwargs={"pk": destruction_list_item.pk},
        )
        response = self.client.get(endpoint)
        content = response.json()

        self.assertEqual(content["supportedRelatedObjectsCount"], None)
        self.assertEqual(content["selectedRelatedObjectsCount"], None)


@tag("e2e")
@tag("flag")
@tag("gh-943")
@AsyncCapableRequestsMock()
class FlagFeatureRelatedCountDisabledE2ETests(GherkinLikeTestCase):
    @override_settings(FEATURE_RELATED_COUNT_DISABLED=False)
    async def test_scenario_list_shows_related_count(
        self, requests_mock: AsyncCapableRequestsMock
    ):
        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            await self.given.record_manager_exists()
            await self.given.list_exists(name="Destruction list to check related count for")

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_clicks_button(page, "Destruction list to check related count for")
            await self.then.url_should_contain_text(page, "edit")
            await self.then.page_should_contain_text(page, "0 / 0")

    @override_settings(FEATURE_RELATED_COUNT_DISABLED=True)
    async def test_scenario_list_doesnt_show_related_count(
        self, requests_mock: AsyncCapableRequestsMock
    ):
        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            await self.given.record_manager_exists()
            await self.given.list_exists(name="Destruction list to check related count for", status=ListStatus.new)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_clicks_button(page, "Destruction list to check related count for")
            await self.then.url_should_contain_text(page, "edit")
            await self.then.page_should_not_contain_text(page, "0 / 0")

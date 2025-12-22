# fmt: off

from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.utils.utils_decorators import AsyncCapableRequestsMock

from ....constants import ListStatus


@tag("e2e")
@tag("gh-558")
@AsyncCapableRequestsMock()
class FeatureListDeleteTests(GherkinLikeTestCase):
    async def test_scenario_delete_list(self, requests_mock: AsyncCapableRequestsMock):
        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            record_manger = await self.given.record_manager_exists()
            await self.given.assignee_exists(user=record_manger)
            await self.given.list_exists(name="Destruction list to delete", status=ListStatus.new)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to delete")
            await self.when.user_clicks_button(page, "Lijst verwijderen")
            await self.when.user_fills_form_field(page, "Type naam van de lijst ter bevestiging", "Destruction list to delete")
            await self.when.user_clicks_button(page, "Lijst verwijderen", 1)

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.not_.list_should_exist(page, name="Destruction list to delete")
            await self.then.not_.page_should_contain_text(page, "Destruction list to delete")

    async def test_scenario_cannot_delete_if_status_not_new(self, requests_mock: AsyncCapableRequestsMock):
        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            record_manger = await self.given.record_manager_exists()
            await self.given.assignee_exists(user=record_manger)
            await self.given.list_exists(name="Destruction list to delete", status=ListStatus.ready_to_delete)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to delete")
            await self.then.not_.page_should_contain_text(page, "Lijst verwijderen")

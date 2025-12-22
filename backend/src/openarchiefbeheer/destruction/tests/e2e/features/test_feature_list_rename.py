# fmt: off

from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.utils.utils_decorators import AsyncCapableRequestsMock

from ....constants import ListStatus


@tag("e2e")
@tag("gh-560")
@AsyncCapableRequestsMock()
class FeatureListRenameTests(GherkinLikeTestCase):
    async def test_scenario_rename_list(self, requests_mock: AsyncCapableRequestsMock):
        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            record_manger = await self.given.record_manager_exists()
            await self.given.assignee_exists(user=record_manger)
            await self.given.list_exists(name="Destruction list to rename", status=ListStatus.new)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to rename")
            await self.when.user_clicks_button(page, "Naam bewerken")
            await self.when.user_fills_form_field(page, "Naam", "Destruction list renamed", role="textbox")
            await self.when.user_clicks_button(page, "Opslaan")
            await self.then.page_should_contain_text(page, "Destruction list renamed")

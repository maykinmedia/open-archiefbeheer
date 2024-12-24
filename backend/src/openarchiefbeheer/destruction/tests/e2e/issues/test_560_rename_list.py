# fmt: off
import asyncio

from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import ListStatus


@tag("e2e")
@tag("gh-560")
class Issue560RenameList(GherkinLikeTestCase):
    async def test_scenario_rename_list(self):
        async with browser_page() as page:
            record_manger = await self.given.record_manager_exists()
            await self.given.assignee_exists(user=record_manger)
            await self.given.list_exists(name="Destruction list to rename", status=ListStatus.new)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to rename")
            await self.when.user_clicks_button(page, "Naam bewerken")
            await self.when.user_fills_form_field(page, "Naam", "Destruction list renamed", role="input")
            await self.when.user_clicks_button(page, "Opslaan")
            await self.then.page_should_contain_text(page, "Destruction list renamed")
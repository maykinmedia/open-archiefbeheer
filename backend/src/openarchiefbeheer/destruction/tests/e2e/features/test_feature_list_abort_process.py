# fmt: off
from asyncio import sleep

from django.test import tag

from openarchiefbeheer.destruction.constants import ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class FeatureListAbortTests(GherkinLikeTestCase):
    async def test_scenario_user_aborts_process(self):
        async with browser_page() as page:
            record_manger = await self.given.record_manager_exists()
            await self.given.assignee_exists(user=record_manger)
            await self.given.archivist_exists()
            destruction_list = await self.given.list_exists(
                name="Destruction list to abort",
                status=ListStatus.internally_reviewed,
                uuid="00000000-0000-0000-0000-000000000000",)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to abort")
            await self.when.user_clicks_button(page, "Proces afbreken")
            await self.when.user_fills_form_field(page, "Opmerking", "gh-501")
            await self.when.user_clicks_button(page, "Proces afbreken", 1)

            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit")
            await sleep(1)  # arefresh_from_db seems not bo be working here.
            await self.then.list_should_have_status(page, destruction_list, ListStatus.new)

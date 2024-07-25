from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import ListStatus


@tag("e2e")
class FeatureListCreateTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_destroys_list(self):
        async with browser_page() as page:
            # fmt: off
            await self.given.record_manager_exists()
            destruction_list = await self.given.list_exists(status=ListStatus.ready_to_delete)

            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "My First Destruction List")

            await self.then.path_should_be(page, f"/destruction-lists/{destruction_list.uuid}")

            await self.when.user_clicks_button(page, "Zaken op lijst definitief vernietigen")
            await self.when.user_fills_form_field(page, "Type naam van de lijst ter bevestiging", "My First Destruction List")
            await self.when.user_clicks_button(page, "100 zaken vernietigen")

            await self.then.path_should_be(page, "/destruction-lists")

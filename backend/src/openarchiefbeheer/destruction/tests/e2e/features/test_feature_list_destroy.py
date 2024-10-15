# fmt: off
from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import ListStatus


@tag("e2e")
class FeatureListDestroyTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_destroys_list(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            destruction_list = await self.given.list_exists(
                name="Destruction list to destroy",
                status=ListStatus.ready_to_delete,
                uuid="00000000-0000-0000-0000-000000000000",
            )

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to destroy")
            await self.then.path_should_be(page, f"/destruction-lists/{destruction_list.uuid}")

            await self.when.user_clicks_button(page, "Vernietigen starten")
            await self.when.user_fills_form_field(page, "Type naam van de lijst ter bevestiging", "Destruction list to destroy")
            await self.when.user_clicks_button(page, "100 zaken vernietigen")

            await self.then.path_should_be(page, "/destruction-lists")
            # TODO: Seems to rely on open zaak (mock?)
            # await self.then.list_should_have_status(page, destruction_list, ListStatus.deleted)

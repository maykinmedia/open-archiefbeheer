# fmt: off
from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.utils.utils_decorators import AsyncCapableRequestsMock

from ....constants import ListStatus


@tag("e2e")
@tag("issue")
@tag("gh-758")
@AsyncCapableRequestsMock()
class Issue758EditDestructionListShowsIncorrectZaaktype(GherkinLikeTestCase):
    async def test_scenario_user_cancels_filtered_edit_mode(self, requests_mock: AsyncCapableRequestsMock):
        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            # await self.given.zaaktype_choices_are_available(page)
            zaken = await self.given.zaken_are_indexed(3)
            await self.given.list_exists(
                name="Destruction list to edit",
                status=ListStatus.new,
                uuid="00000000-0000-0000-0000-000000000000",
                zaken=[zaken[0]]
            )

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to edit")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit")
            await self.then.page_should_contain_text(page, "Zaak-")

            await self.when.user_clicks_button(page, "Bewerken", 2)
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?page=1&is_editing=true")

            await self.when.user_clicks_checkbox(page, "(de)selecteer rij", 1)
            await self.when.user_clicks_button(page, "Vernietigingslijst aanpassen")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit")

            await self.then.page_should_contain_text(page, zaken[0]._expand['zaaktype']['omschrijving'])
            await self.then.page_should_contain_text(page, zaken[1]._expand['zaaktype']['omschrijving'])

# fmt: off
from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import ListStatus


@tag("e2e")
class Issue290CancelFilteredEditMode(GherkinLikeTestCase):
    async def test_scenario_user_cancels_filtered_edit_mode(self):
        async with browser_page() as page:
            await self.given.list_exists(
                name="Destruction list to edit",
                status=ListStatus.new,
                uuid="00000000-0000-0000-0000-000000000000",
            )

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to edit")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit")
            await self.then.page_should_contain_text(page, "Zaak-")
            await self.when.user_clicks_button(page, "Bewerken", 2)
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?page=1&is_editing=true")
            await self.when.user_fills_form_field(page, "Identificatie", "non-matching-identifier", "textbox")

            await self.then.url_should_contain_text(page, ".*non-matching-identifier.*")
            await self.then.not_.page_should_contain_text(page, "Zaak-")

            await self.when.user_clicks_button(page, "Annuleren")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit")
            await self.then.page_should_contain_text(page, "Zaak-")

# fmt: off
from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class FeatureListEditTests(GherkinLikeTestCase):
    async def test_scenario_user_edits_multi_page_destruction_list(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.given.zaken_are_indexed(300, recreate=True)
            reviewer = await self.given.reviewer_exists()

            # Create destruction list
            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 0)
            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.when.user_clicks_button(page, "volgende")
            await self.when.user_clicks_checkbox(page, "(de)selecteer 100 rijen")  # All zaken on second page
            await self.when.user_clicks_button(page, "volgende")
            await self.then.path_should_be(page, "/destruction-lists/create?page=3")

            await self.when.user_selects_zaak(page, "ZAAK-200")  # First zaak on third (last) page
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 1)

            await self.when.user_fills_form_field(page, "Naam", "Destruction list to edit")
            await self.when.user_fills_form_field(page, "Reviewer", reviewer.username)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)
            await self.then.path_should_be(page, "/destruction-lists")

            # View destruction list
            destruction_list = await self.then.list_should_exist(page, "Destruction list to edit")
            await self.when.user_clicks_button(page, "Destruction list to edit")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}")

            await self.when.user_clicks_button(page, "2")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}?page=2")
            await self.then.page_should_contain_text(page, "ZAAK-200")

            # Add "ZAAK-100"
            await self.when.user_clicks_button(page, "Bewerken", 1)
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}?page=1&is_editing=true")

            await self.when.user_clicks_button(page, "2")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}?page=2&is_editing=true")
            await self.then.zaak_should_be_selected(page, "ZAAK-200")
            await self.then.not_.zaak_should_be_selected(page, "ZAAK-100")  # First unselected zaak

            await self.when.user_selects_zaak(page, "ZAAK-100")
            await self.when.user_clicks_button(page, "Vernietigingslijst aanpassen")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}")

            # View updated destruction list
            await self.when.user_clicks_button(page, "2")
            await self.then.page_should_contain_text(page, "ZAAK-100")

            # Remove "ZAAK-100"
            await self.when.user_clicks_button(page, "Bewerken", 1)
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}?page=1&is_editing=true")

            await self.when.user_clicks_button(page, "2")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}?page=2&is_editing=true")
            await self.then.zaak_should_be_selected(page, "ZAAK-200")
            await self.then.zaak_should_be_selected(page, "ZAAK-100")  # First unselected zaak

            await self.when.user_selects_zaak(page, "ZAAK-100")
            await self.when.user_clicks_button(page, "Vernietigingslijst aanpassen")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}")

            # View updated destruction list
            await self.then.page_should_contain_text(page, "ZAAK-99")
            await self.when.user_clicks_button(page, "2")
            await self.then.not_.page_should_contain_text(page, "ZAAK-100")

# fmt: off
from django.test import tag

from asgiref.sync import sync_to_async

from openarchiefbeheer.destruction.models import DestructionList
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@sync_to_async()
def get_list(name):
    return DestructionList.objects.get(name=name)


@tag("e2e")
class FeatureListCreateSelectAllTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_creates_list_with_select_all(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            reviewer = await self.given.reviewer_exists(username="Beoordelaar")
            await self.given.zaken_are_indexed(200)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.when.user_clicks_checkbox(page, "(de)selecteer 2 pagina's", index=0)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", index=1)
            await self.when.user_fills_form_field(page, "Naam", "Destruction list select all")
            await self.when.user_fills_form_field(page, "Reviewer", str(reviewer))
            await self.when.user_fills_form_field(page, "Opmerking", "Youhuuu")
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list select all")

            destruction_list = await get_list("Destruction list select all")

            await self.then.list_should_have_number_of_items(destruction_list, 200)

    async def test_scenario_record_manager_creates_list_with_select_all_and_filters(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            reviewer = await self.given.reviewer_exists(username="Beoordelaar")
            # This creates a zaak that should NOT be added to the list (since it's already in a list)
            await self.given.list_item_exists()
            # These zaken should be on the create page
            await self.given.zaken_are_indexed(5, omschrijving="Test 1")
            await self.given.zaken_are_indexed(5, omschrijving="Test 2")
            
            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.when.user_filters_zaken(page, "omschrijving", "Test 1")
            await self.then.page_should_contain_text(page, "(de)selecteer 5 rijen")

            await self.when.user_clicks_checkbox(page, "(de)selecteer 1 pagina's", index=0)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", index=1)
            await self.when.user_fills_form_field(page, "Naam", "Destruction list select all with filters")
            await self.when.user_fills_form_field(page, "Reviewer", str(reviewer))
            await self.when.user_fills_form_field(page, "Opmerking", "Magnificent list.")
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list select all with filters")

            destruction_list = await get_list("Destruction list select all with filters")

            await self.then.list_should_have_number_of_items(destruction_list, 5)

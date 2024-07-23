from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class FeatureListCreateTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_creates_list(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.given.reviewer_exists(username="Beoordelaar 1")
            await self.given.reviewer_exists(username="Beoordelaar 2")
            await self.given.zaken_are_indexed(100)

            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")

            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.when.user_clicks_checkbox(page, "(de)selecteer rij", index=0)
            await self.when.user_clicks_button(
                page, "Vernietigingslijst opstellen", index=1
            )
            await self.when.user_fills_form_field(
                page, "Naam", "Mijn Eerste Vernietigingslijst"
            )
            await self.when.user_fills_form_field(
                page, "Eerste reviewer", "Beoordelaar 1"
            )
            await self.when.user_fills_form_field(
                page, "Tweede reviewer", "Beoordelaar 2"
            )
            await self.when.user_clicks_button(page, "Verzenden")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(
                page, "Mijn Eerste Vernietigingslijst"
            )

    async def test_scenario_reviewer_cannot_create_list(self):
        async with browser_page() as page:
            await self.given.reviewer_exists()
            await self.given.zaken_are_indexed(100)

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")

            await self.then.path_should_be(
                page, "/login?next=/destruction-lists/create"
            )

    async def test_scenario_archivist_cannot_create_list(self):
        async with browser_page() as page:
            await self.given.archivist_exists()
            await self.given.zaken_are_indexed(100)

            await self.when.archivist_logs_in(page)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")

            await self.then.path_should_be(
                page, "/login?next=/destruction-lists/create"
            )

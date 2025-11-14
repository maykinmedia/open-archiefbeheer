from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
@tag("issue")
@tag("gh-843")
class Issue841ReassignWhenChangesRequestedTestCase(GherkinLikeTestCase):
    async def test_scenario_update_reviewer_when_changes_requested(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            reviewer1 = await self.given.reviewer_exists(username="reviewer1")
            reviewer2 = await self.given.reviewer_exists(username="reviewer2")
            await self.given.zaken_are_indexed(2)

            # Record manager creates list and sends it to reviewer 1
            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.when.user_clicks_checkbox(page, "(de)selecteer rij", index=0)
            await self.when.user_clicks_button(
                page, "Vernietigingslijst opstellen", index=1
            )
            await self.when.user_fills_form_field(
                page, "Naam", "gh-841-destruction-list"
            )
            await self.when.user_fills_form_field(page, "Reviewer", str(reviewer1))
            await self.when.user_fills_form_field(
                page, "Toelichting", "Description bla."
            )
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.list_should_exist(page, "gh-841-destruction-list")

            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "gh 841 destruction list")
            await self.when.user_clicks_button(page, "Ter beoordeling indienen")
            await self.when.user_clicks_button(page, "Ter beoordeling indienen", 1)

            await self.then.path_should_be(page, "/destruction-lists")

            # Reviewer 1 rejects the list
            await self.when.reviewer_logs_in(page, username=reviewer1.username)
            await self.when.user_clicks_button(page, "gh 841 destruction list")
            await self.when.user_clicks_button(page, "Uitzonderen")
            await self.when.user_fills_form_field(
                page, "Reden", "Please reconsider this zaak"
            )

            await self.when.user_clicks_button(page, "Zaak uitzonderen")
            await self.when.user_clicks_button(page, "Afwijzen")
            await self.when.user_fills_form_field(
                page, "Reden", "Please reconsider the zaak on this list"
            )
            await self.when.user_clicks_button(page, "Vernietigingslijst afwijzen")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_logs_out(page)

            # The record manager reassigns the reviewer and then re-submits the list.
            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "gh 841 destruction list")
            await self.when.user_clicks_button(page, "Beoordelaar bewerken")
            await self.when.user_fills_form_field(page, "Beoordelaar", str(reviewer2))
            await self.when.user_fills_form_field(
                page, "Reden", "Ik houd niet van Reviewer 1."
            )
            await self.when.user_clicks_button(page, "Toewijzen")
            await self.then.page_should_contain_text(page, str(reviewer1))

            await self.when.user_clicks_button(page, "Muteren")
            await self.when.user_clicks_radio(page, "Afwijzen van het voorstel")
            await self.when.user_fills_form_field(page, "Reden", "I like this case.")
            await self.when.user_clicks_button(page, "muteren")
            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(page, "Opmerking", "Let's gooo.")
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")

# fmt: off
from django.test import tag

from openarchiefbeheer.destruction.constants import (
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
)
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class FeatureListCreateTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_process_review(self):
        async with browser_page() as page:
            await self.given.selectielijstklasse_choices_are_available(page)
            record_manager = await self.given.record_manager_exists()
            reviewer1 = await self.given.reviewer_exists(username="Beoordelaar 1")
            reviewer2 = await self.given.reviewer_exists(username="Beoordelaar 2")

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer1, role=ListRole.reviewer),
                await self.given.assignee_exists(user=reviewer2, role=ListRole.reviewer),
            ]

            destruction_list = await self.given.list_exists(
                assignee=record_manager,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to process",
                status=ListStatus.changes_requested,
            )

            # Both reviewers provided a review.
            await self.given.review_exists(author=reviewer1, destruction_list=destruction_list, decision=ReviewDecisionChoices.accepted)
            await self.given.review_exists(author=reviewer2, destruction_list=destruction_list, decision=ReviewDecisionChoices.rejected)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to process")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000")

            # TODO
            await self.when.user_clicks_checkbox(page, "(de)selecteer rij")

            # Fill selectielijstklasse as it's probably missing.
            await self.when.user_clicks_radio(page, "Aanpassen van selectielijstklasse")
            await self.when.user_fills_form_field(page, "Selectielijstklasse", "11.1 - Verleend - vernietigen - P1Y")

            # Fill archive date
            await self.when.user_clicks_radio(page, "Verlengen bewaartermijn")
            await self.when.user_fills_form_field(page, "Archief datum", "09/15/2023")
            await page.keyboard.press("Enter")

            await self.when.user_fills_form_field(page, "Reden", "Andere datum")
            await self.when.user_clicks_button(page, "muteren")
            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(page, "Opmerking", "Datum aangepast")
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")

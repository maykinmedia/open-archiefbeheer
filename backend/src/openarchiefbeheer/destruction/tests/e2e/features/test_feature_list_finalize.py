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
class FeatureListFinalizeTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_finalizes_list(self):
        async with browser_page() as page:
            record_manager = await self.given.record_manager_exists()
            reviewer = await self.given.reviewer_exists(username="Beoordelaar")
            await self.given.archivist_exists(username="Archivaris")

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer, role=ListRole.main_reviewer),
            ]

            destruction_list = await self.given.list_exists(
                assignee=record_manager,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to finalize",
                status=ListStatus.internally_reviewed,
            )

            # Reviewer provided a review.
            await self.given.review_exists(author=reviewer, destruction_list=destruction_list, decision=ReviewDecisionChoices.accepted)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to finalize")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit")

            await self.when.user_clicks_button(page, "Markeren als definitief")
            await self.when.user_fills_form_field(page, "Archivaris", "Archivaris")
            await self.when.user_fills_form_field(page, "Comment", "Dit is een test comment")
            await self.when.user_clicks_button(page, "Markeer als definitief")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to finalize")
            await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_for_archivist)

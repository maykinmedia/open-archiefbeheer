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
    async def test_scenario_reviewer_approves_list(self):
        async with browser_page() as page:
            record_manager = await self.given.record_manager_exists()
            reviewer1 = await self.given.reviewer_exists(username="peer_reviewer", first_name="Peer", last_name="Reviewer")
            reviewer2 = await self.given.reviewer_exists()
            archivist = await self.given.archivist_exists()

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer1, role=ListRole.reviewer),
                await self.given.assignee_exists(user=reviewer2, role=ListRole.reviewer),
                await self.given.assignee_exists(user=archivist, role=ListRole.archivist),
            ]

            list = await self.given.list_exists(
                assignee=reviewer2,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
            )

            # Reviewer 1 already provided a review.
            await self.given.review_exists(author=reviewer1, destruction_list=list, decision=ReviewDecisionChoices.accepted)

            await self.when.reviewer_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to review")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review")

            await self.when.user_clicks_button(page, "Accorderen")
            await self.when.user_fills_form_field(page, "Opmerking", "Looks good to me👍🏻")
            await self.when.user_clicks_button(page, "Accorderen")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to review")
            await self.then.list_should_have_status(page, list, ListStatus.internally_reviewed)

    async def test_scenario_reviewer_rejects_list(self):
        async with browser_page() as page:
            record_manager = await self.given.record_manager_exists()
            reviewer1 = await self.given.reviewer_exists(username="peer_reviewer", first_name="Peer", last_name="Reviewer")
            reviewer2 = await self.given.reviewer_exists()
            archivist = await self.given.archivist_exists()

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer1, role=ListRole.reviewer),
                await self.given.assignee_exists(user=reviewer2, role=ListRole.reviewer),
                await self.given.assignee_exists(user=archivist, role=ListRole.archivist),
            ]

            list = await self.given.list_exists(
                assignee=reviewer2,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
            )

            # Reviewer 1 already provided a review.
            await self.given.review_exists(author=reviewer1, destruction_list=list, decision=ReviewDecisionChoices.accepted)

            await self.when.reviewer_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to review")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review")
            await self.when.user_clicks_checkbox(page, "(de)selecteer rij")
            await self.when.user_fills_form_field(page, "Reden van uitzondering", "Please reconsider this zaak")
            await self.when.user_clicks_button(page, "Uitzonderen")
            await self.when.user_clicks_button(page, "Beoordelen")
            await self.when.user_fills_form_field(page, "Opmerking", "Please reconsider the zaak on this list")
            await self.when.user_clicks_button(page, "Beoordelen")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to review")
            await self.then.list_should_have_status(page, list, ListStatus.changes_requested)

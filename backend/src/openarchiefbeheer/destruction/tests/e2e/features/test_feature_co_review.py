# fmt: off
from django.db import transaction
from django.test import tag

from openarchiefbeheer.destruction.constants import ListRole, ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class FeatureCoReviewTests(GherkinLikeTestCase):
    @transaction.atomic
    async def test_scenario_co_reviewer_select_zaken_visible_to_reviewer(self):
        async with browser_page() as page:
            reviewer = await self.given.reviewer_exists()
            reviewer_assignee = await self.given.assignee_exists(user=reviewer, role=ListRole.main_reviewer)
            co_reviewer = await self.given.co_reviewer_exists()
            co_reviewer_assignee = await self.given.assignee_exists(user=co_reviewer, role=ListRole.co_reviewer)

            await self.given.list_exists(
                assignee=reviewer,
                assignees=[reviewer_assignee, co_reviewer_assignee],
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to co-review",
                status=ListStatus.ready_to_review,
            )

            # Reviewer approves first case.
            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to co-review")
            await self.when.user_clicks_checkbox(page, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Geaccordeerd")

            # Log out.
            await self.when.user_logs_out(page)

            # Co-reviewer should see first case approved.
            await self.when.co_reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to co-review")
            await self.then.page_should_contain_text(page, "Geaccordeerd")

            # Co-reviewer rejects see second case.
            await self.when.user_clicks_button(page, "Uitzonderen")
            await self.when.user_fills_form_field(page, "Reden", "gh-448")
            await self.when.user_clicks_button(page, "Zaak uitzonderen")
            await self.then.page_should_contain_text(page, "Uitgezonderd")

            # Log out.
            await self.when.user_logs_out(page)

            # Reviewer should see second case rejected.
            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to co-review")
            await self.then.page_should_contain_text(page, "Uitgezonderd")

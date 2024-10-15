# fmt: off
from django.test import tag

from openarchiefbeheer.destruction.constants import ListRole, ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class FeatureListMarkReadyForReviewTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_marks_list_as_ready_to_review(self):
        async with browser_page() as page:
            await self.given.zaken_are_indexed(amount=100)

            record_manager = await self.given.record_manager_exists()
            reviewer1 = await self.given.reviewer_exists(username="beoordelaar 1")
            reviewer2 = await self.given.reviewer_exists(username="beoordelaar 2")

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer1, role=ListRole.reviewer),
                await self.given.assignee_exists(user=reviewer2, role=ListRole.reviewer),
            ]

            destruction_list = await self.given.list_exists(name="list ready to review", status=ListStatus.new, assignees=assignees)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "list ready to review")

            await self.when.user_clicks_button(page, "list ready to review")
            await self.when.user_clicks_button(page, "Ter beoordeling indienen")
            await self.when.user_clicks_button(page, "Ter beoordeling indienen", 1)

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "list ready to review")
            await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_to_review)
            await self.then.list_should_have_assignee(page, destruction_list, reviewer1)

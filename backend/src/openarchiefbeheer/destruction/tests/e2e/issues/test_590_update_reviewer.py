# fmt: off
from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import ListRole, ListStatus


@tag("e2e")
@tag("gh-590")
class Issue590UpdateReviewer(GherkinLikeTestCase):
    async def test_scenario_record_manager_updates_reviewer(self):
        async with browser_page() as page:
            record_manger = await self.given.record_manager_exists()
            record_manger_reviewer = await self.given.record_manager_exists(post__can_review_destruction=True)
            reviewer = await self.given.reviewer_exists(username="reviewer", first_name="John", last_name="Doe")

            await self.given.assignee_exists(user=record_manger_reviewer)
            assignee_reviewer = await self.given.assignee_exists(user=record_manger_reviewer, role=ListRole.main_reviewer)

            destruction_list = await self.given.list_exists(
                name="Destruction list to update reviewer", 
                assignees=[assignee_reviewer], 
                assignee=record_manger_reviewer, 
                author=record_manger, 
                status=ListStatus.ready_to_review
            )

            await self.when.user_logs_in(page, record_manger_reviewer)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.list_should_have_assignee(page, destruction_list, record_manger_reviewer)

            await self.when.user_clicks_button(page, "Destruction list to update reviewer")
            await self.when.user_clicks_button(page, "Beoordelaar bewerken")
            await self.when.user_fills_form_field(page, "Beoordelaar", "John Doe (reviewer)")
            await self.when.user_fills_form_field(page, "Reden", "gh-590")
            await self.when.user_clicks_button(page, "Toewijzen")

            await self.then.page_should_contain_text(page, "Destruction list to update reviewer")
            await self.then.list_should_have_assignee(page, destruction_list, reviewer)

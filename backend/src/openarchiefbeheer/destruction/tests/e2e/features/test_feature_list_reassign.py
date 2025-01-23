# fmt: off
from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from openarchiefbeheer.destruction.constants import ListStatus


@tag("e2e")
class FeatureListReassignTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_updates_reviewer(self):
        async with browser_page() as page:
            record_manger = await self.given.record_manager_exists()
            reviewer1 = await self.given.reviewer_exists(username="reviewer1", first_name="John", last_name="Doe")
            reviewer2 = await self.given.reviewer_exists(username="reviewer2", first_name="Jane", last_name="Doe")

            await self.given.assignee_exists(user=record_manger)
            assignee_reviewer1 = await self.given.assignee_exists(user=reviewer1)

            destruction_list = await self.given.list_exists(name="Destruction list to update", assignees=[assignee_reviewer1], assignee=assignee_reviewer1.user, status=ListStatus.ready_to_review)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.list_should_have_assignee(page, destruction_list, reviewer1)

            await self.when.user_clicks_button(page, "Destruction list to update")
            await self.when.user_clicks_button(page, "Beoordelaar bewerken")
            await self.when.user_fills_form_field(page, "Beoordelaar", "Jane Doe (reviewer2)")
            await self.when.user_fills_form_field(page, "Reden", "gh-459")
            await self.when.user_clicks_button(page, "Toewijzen")

            await self.then.page_should_contain_text(page, "Destruction list to update")
            await self.then.list_should_have_assignee(page, destruction_list, reviewer2)

# fmt: off
from django.test import tag

from openarchiefbeheer.destruction.constants import (
    DestructionListItemAction,
    ListStatus,
)
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
@tag("issue")
@tag("gh-618")
class Issue618NoHerbeoordelingForArchivaris(GherkinLikeTestCase):
    async def test_scenario_approval_with_rereview(self):
        async with browser_page() as page:
            zaken = await self.given.zaken_are_indexed(1)

            archivist = await self.given.archivist_exists()
            destruction_list = await self.given.list_exists(
                name="Destruction list to re-review",
                status=ListStatus.ready_for_archivist,
                uuid="00000000-0000-0000-0000-000000000000",
                assignee=archivist,
                zaken=zaken
            )
            await self.given.zaak_selection_exists(1, zaak_url=zaken[0].url, selection_data={"selected": False}, key="destruction-list-review-00000000-0000-0000-0000-000000000000-ready_for_archivist")
            await self.given.review_item_response_exists(action_item=DestructionListItemAction.keep, review_item__destruction_list=destruction_list, review_item__destruction_list_item=await destruction_list.items.afirst())

            await self.when.archivist_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to re review")

            await self.then.page_should_contain_text(page, "Goedkeuren")
            await self.then.not_.page_should_contain_text(page, "Herboordelen")

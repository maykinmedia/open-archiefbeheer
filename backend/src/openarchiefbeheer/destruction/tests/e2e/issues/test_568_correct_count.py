from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import InternalStatus, ListStatus


@tag("e2e")
@tag("gh-568")
class Issue568CorrectCount(GherkinLikeTestCase):
    async def test_destruction_fails_with_incorrect_count(self):
        async with browser_page() as page:
            zaken = await self.given.zaken_are_indexed(amount=5)
            await self.given.record_manager_exists()

            destruction_list = await self.given.list_exists(
                name="Destruction list to check count for",
                status=ListStatus.ready_to_delete,
                processing_status=InternalStatus.failed,
                zaken=[],
            )
            await self.given.list_item_exists(
                destruction_list=destruction_list,
                processing_status=InternalStatus.new,
                zaak=zaken[0],
            )
            await self.given.list_item_exists(
                destruction_list=destruction_list,
                processing_status=InternalStatus.failed,
                zaak=zaken[1],
            )
            await self.given.list_item_exists(
                destruction_list=destruction_list,
                processing_status=InternalStatus.processing,
                zaak=zaken[2],
            )
            await self.given.list_item_exists(
                destruction_list=destruction_list,
                processing_status=InternalStatus.queued,
                zaak=zaken[3],
            )
            await self.given.list_item_exists(
                destruction_list=destruction_list,
                processing_status=InternalStatus.succeeded,
                zaak=zaken[4],
            )

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(
                page, "Destruction list to check count for"
            )
            await self.when.user_clicks_button(page, "Vernietigen herstarten")
            await self.then.page_should_contain_text(
                page, "U staat op het punt om 4 zaken definitief te vernietigen"
            )

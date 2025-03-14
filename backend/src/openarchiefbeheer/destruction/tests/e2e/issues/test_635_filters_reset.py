# fmt: off
from django.test import tag

from openarchiefbeheer.destruction.constants import ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
@tag("gh-635")
class Issue635FiltersReset(GherkinLikeTestCase):
    # Tests if:
    # - Reset button resets query parameters
    # - Reset button resets input fields
    # - Reset button resets page number to 1
    # - Reset button is not shown when no filters are applied
    async def test_scenario_reset_button_works(self):
        async with browser_page() as page:
            zaken = await self.given.zaken_are_indexed(amount=500)
            record_manager = await self.given.record_manager_exists()

            await self.given.list_exists(
                name="Destruction list to reset filters for",
                status=ListStatus.ready_to_review,
                zaken=zaken,
            )

            await self.when.user_logs_in(page, record_manager)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_clicks_button(page, "Destruction list to reset filters for")
            await self.then.url_should_contain_text(page, "destruction-lists/")
            initial_url_with_page = page.url + "?page=1"
            await self.when.user_clicks_button(page, "Volgende")
            await self.then.url_should_contain_text(page, "page=2")
            await self.then.page_should_not_contain_text(page, "Filters wissen")
            await self.when.user_filters_zaken(page, "omschrijving", "some text")
            await self.then.url_should_contain_text(page, "omschrijving__icontains=")
            await self.when.user_clicks_button(page, "Filters wissen")
            await self.then.input_field_should_be_empty(page, "Omschrijving")
            await self.then.url_should_be(page, initial_url_with_page)

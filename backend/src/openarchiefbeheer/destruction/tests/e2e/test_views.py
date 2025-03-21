from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class DestructionListViewsTests(GherkinLikeTestCase):
    async def test_login_redirects_to_destruction_list(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

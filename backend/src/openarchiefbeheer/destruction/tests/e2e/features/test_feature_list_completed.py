# fmt: off
from django.test import tag
from django.utils import timezone

from openarchiefbeheer.destruction.constants import InternalStatus, ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class FeatureListCompleted(GherkinLikeTestCase):
    async def test_list_completed_successfully(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.given.list_exists(name="Completed destruction list (succeeded)", status=ListStatus.deleted, processing_status=InternalStatus.succeeded, end=timezone.now())

            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "Afgeronde vernietigingslijsten")
            await self.then.path_should_be(page, "/completed-destruction-lists")
            await self.then.page_should_contain_text(page, "Completed destruction list (")  # Selector according to Playwright Inspector.

    async def test_list_completed_failed(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.given.list_exists(name="Completed destruction list (failed)", status=ListStatus.deleted, processing_status=InternalStatus.failed, end=timezone.now())

            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "Afgeronde vernietigingslijsten")
            await self.then.path_should_be(page, "/completed-destruction-lists")
            await self.then.page_should_not_contain_text(page, "Completed destruction list (")  # Selector according to Playwright Inspector.

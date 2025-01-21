# fmt: off
from django.test import override_settings, tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import ListStatus


@tag("e2e")
@override_settings(SESSION_COOKIE_AGE=1)
class Issue600SessionExpired(GherkinLikeTestCase):
    async def test_session_expired(self):
        async with browser_page() as page:
            await self.given.list_exists(
                name="Destruction list to click",
                status=ListStatus.new,
                uuid="00000000-0000-0000-0000-000000000000",
            )
            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_clicks_button(page, "Destruction list to click")
            await self.then.page_should_contain_text(page, "Zaak-")
            await self.then.page_should_contain_text(page, "Your session has expired, please log in again.")

# fmt: off
from django.test import override_settings, tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.utils.utils_decorators import AsyncCapableRequestsMock

from ....constants import ListStatus


@tag("e2e")
@tag("issue")
@tag("gh-600")
@override_settings(SESSION_COOKIE_AGE=2)
@AsyncCapableRequestsMock()
class Issue600SessionExpired(GherkinLikeTestCase):
    async def test_session_expired(self, requests_mock: AsyncCapableRequestsMock):
        """Test error message on page with polling

        If the session has expired, the polling will receive a 403 with
        a specific error.
        Note: the SESSION_COOKIE_AGE setting needs to give enough time to the
        test to reach the detail page of the destruction list.
        """
        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            await self.given.list_exists(
                name="Destruction list to click",
                status=ListStatus.new,
                uuid="00000000-0000-0000-0000-000000000000",
            )
            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_clicks_button(page, "Destruction list to click")
            await self.then.page_should_contain_text(page, "Zaak-")
            await self.then.page_should_contain_text(page, "Uw sessie is verlopen, log alstublieft opnieuw in.", 30000)

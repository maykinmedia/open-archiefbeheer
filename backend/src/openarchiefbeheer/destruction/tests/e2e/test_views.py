from django.test import tag

from asgiref.sync import sync_to_async
from playwright.async_api import expect

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.utils.tests.e2e import PlaywrightTestCase, browser_page


@tag("e2e")
class DestructionListViewsTests(PlaywrightTestCase):
    async def test_login_redirects_to_destruction_list(self):
        # Any function interacting with the database needs to be wrapped with sync_to_async
        @sync_to_async
        def _create_record_manager():
            record_manager = UserFactory.create(
                post__can_start_destruction=True,
                password="ANic3Password",
            )
            return record_manager

        record_manager = await _create_record_manager()

        async with browser_page() as page:
            await page.goto(self.live_server_url)

            await page.wait_for_url(
                f"{self.live_server_url}/login?next=/destruction-lists"
            )

            await page.get_by_label("Gebruikersnaam").fill(record_manager.username)
            await page.get_by_label("Wachtwoord").fill("ANic3Password")
            await page.get_by_role("button", name="Inloggen").click()

            await expect(page).to_have_url(f"{self.live_server_url}/destruction-lists")

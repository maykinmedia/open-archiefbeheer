from django.test import tag
from django.utils.translation import gettext_lazy as _

from playwright.async_api import expect

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e", "oidc")
class OIDCLoginTest(GherkinLikeTestCase):
    fixtures = ["permissions.json", "oidc_config_test.json"]

    async def test_login_admin_superuser_with_oidc(self):
        async with browser_page() as page:
            await page.goto(f"{self.live_server_url}/admin")

            link = page.get_by_role("link", name=_("Login with OIDC"))

            await expect(link).to_be_visible()

            await link.click()

            username_field = page.get_by_role("textbox", name="username")
            await username_field.fill(
                "john_doe"
            )  # configured in the Keycloak fixture as superuser

            password_field = page.get_by_role("textbox", name="password")
            await password_field.fill("aNic3Passw0rd")

            login_button = page.get_by_role("button", name="Sign In")
            await login_button.click()

            await page.wait_for_url(f"{self.live_server_url}/admin/")

            configuration_link = page.get_by_role("link", name="API-configuratie")
            await expect(configuration_link).to_be_visible()

    async def test_login_admin_staff_with_oidc(self):
        async with browser_page() as page:
            await page.goto(f"{self.live_server_url}/admin")

            link = page.get_by_role("link", name=_("Login with OIDC"))

            await expect(link).to_be_visible()

            await link.click()

            username_field = page.get_by_role("textbox", name="username")
            await username_field.fill(
                "alice_doe"
            )  # configured in the Keycloak fixture as record manager

            password_field = page.get_by_role("textbox", name="password")
            await password_field.fill("aNic3Passw0rd")

            login_button = page.get_by_role("button", name="Sign In")
            await login_button.click()

            await page.wait_for_url(f"{self.live_server_url}/admin/")

            page_text = page.get_by_text("You don't have permission to")
            await expect(page_text).to_be_visible()

    async def test_login_app_with_oidc(self):
        async with browser_page() as page:
            await page.goto(self.live_server_url)
            await page.wait_for_url(
                f"{self.live_server_url}/login?next=/destruction-lists"
            )

            login_button = page.get_by_text("Organisatie login")

            await login_button.click()

            username_field = page.get_by_role("textbox", name="username")
            await username_field.fill(
                "alice_doe"
            )  # configured in the Keycloak fixture as record manager

            password_field = page.get_by_role("textbox", name="password")
            await password_field.fill("aNic3Passw0rd")

            login_button = page.get_by_role("button", name="Sign In")
            await login_button.click()

            await page.wait_for_url(f"{self.live_server_url}/destruction-lists")

            page_text = page.get_by_role("heading", name="Vernietigingslijsten")
            await expect(page_text).to_be_visible()

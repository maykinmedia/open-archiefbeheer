from asgiref.sync import sync_to_async
from playwright.async_api import expect

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.utils.tests.e2e import PlaywrightTestCase
from openarchiefbeheer.zaken.tests.factories import ZaakFactory


class GherkinLikeTestCase(PlaywrightTestCase):
    """
    Experimental approach to writing Gherkin-like style test scenarios.
    Example:

        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.when.record_manager_logs_in(page)
            await self.then.page_should_contain_text(page, "Vernietigingslijsten")


    Overview:
    =========

    1. **Given**:
        - The "Given" steps set up the initial context or state for the scenario.
        - These steps are used to describe the initial situation before an action is taken.
        - Example:

            async with browser_page() as page:
                await self.given.record_manager_exists()

    2. **When**:
        - The "When" steps describe the actions or events that occur.
        - These steps are used to specify the actions taken by the user or the system.
        - Example:

            async with browser_page() as page:
                await self.when.record_manager_logs_in(page)

    3. **Then**:
        - The "Then" steps specify the expected outcomes or results.
        - These steps are used to verify the results of the actions taken in the "When" steps.
        - Example:

            async with browser_page() as page:
                await self.then.page_should_contain_text(page, "Vernietigingslijsten")

    These keywords help in structuring the test scenarios in a readable and organized manner, making it easier to
    understand the test flow and the expected outcomes.
    """

    @property
    def given(self):
        return self.Given(self)

    @property
    def when(self):
        return self.When(self)

    @property
    def then(self):
        return self.Then(self)

    class Given:
        """
        The "Given" steps set up the initial context or state for the scenario.
        These steps are used to describe the initial situation before an action is taken.

        Example:

            async with browser_page() as page:
                await self.given.record_manager_exists()
        """

        def __init__(self, testcase):
            self.testcase = testcase

        async def record_manager_exists(self, **kwargs):
            base_kwargs = {
                "username": "Record Manager",
                "first_name": "Record",
                "last_name": "Manager",
                "role__can_start_destruction": True,
                "password": "ANic3Password",
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self._get_or_create(UserFactory, **merged_kwargs)

        async def reviewer_exists(self, **kwargs):
            base_kwargs = {
                "username": "Beoordelaar",
                "first_name": "Beoor",
                "last_name": "del Laar",
                "role__can_review_destruction": True,
                "password": "ANic3Password",
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self._get_or_create(UserFactory, **merged_kwargs)

        async def archivist_exists(self, **kwargs):
            base_kwargs = {
                "username": "Achivaris",
                "first_name": "Archi",
                "last_name": "Varis",
                "role__can_review_final_list": True,
                "password": "ANic3Password",
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self._get_or_create(UserFactory, **merged_kwargs)

        async def user_exists(self, **kwargs):
            return await self._get_or_create(UserFactory, **kwargs)

        async def zaken_are_indexed(self, amount):
            return await self._get_or_create_batch(ZaakFactory, amount)

        @sync_to_async
        def _orm_get(self, model, **kwargs):
            return model.objects.get(**kwargs)

        @sync_to_async
        def _orm_filter(self, model, **kwargs):
            return (
                model.objects.filter(**kwargs) or False
            )  # Easier to with in async calls

        @sync_to_async
        def _factory_create(self, factory, **kwargs):
            return factory.create(**kwargs)

        @sync_to_async
        def _factory_create_batch(self, factory, amount, **kwargs):
            return factory.create_batch(amount, **kwargs)

        async def _get_or_create(self, factory, **kwargs):
            try:
                return await self._orm_get(factory._meta.model, **kwargs)
            except User.DoesNotExist:
                return await self._factory_create(factory, **kwargs)

        async def _get_or_create_batch(self, factory, amount, **kwargs):
            queryset = await self._orm_filter(factory._meta.model, **kwargs)
            if queryset:
                return queryset
            return await self._factory_create_batch(factory, amount, **kwargs)

    class When:
        """
        The "When" steps describe the actions or events that occur.
        These steps are used to specify the actions taken by the user or the system.

        Example:

            async with browser_page() as page:
                await self.when.record_manager_logs_in(page)
        """

        def __init__(self, testcase):
            self.testcase = testcase

        async def record_manager_logs_in(self, page):
            await page.goto(self.testcase.live_server_url)
            await page.wait_for_url(
                f"{self.testcase.live_server_url}/login?next=/destruction-lists"
            )

            await page.get_by_label("Gebruikersnaam").fill("Record Manager")
            await page.get_by_label("Wachtwoord").fill("ANic3Password")
            await page.get_by_role("button", name="Inloggen").click()

        async def reviewer_logs_in(self, page):
            await page.goto(self.testcase.live_server_url)
            await page.wait_for_url(
                f"{self.testcase.live_server_url}/login?next=/destruction-lists"
            )

            await page.get_by_label("Gebruikersnaam").fill("Beoordelaar")
            await page.get_by_label("Wachtwoord").fill("ANic3Password")
            await page.get_by_role("button", name="Inloggen").click()

        async def archivist_logs_in(self, page):
            await page.goto(self.testcase.live_server_url)
            await page.wait_for_url(
                f"{self.testcase.live_server_url}/login?next=/destruction-lists"
            )

            await page.get_by_label("Gebruikersnaam").fill("Achivaris")
            await page.get_by_label("Wachtwoord").fill("ANic3Password")
            await page.get_by_role("button", name="Inloggen").click()

        async def user_clicks_button(self, page, name, index=None):
            await self._user_clicks("button", page, name, index=index)

        async def user_clicks_checkbox(self, page, name, index=None):
            await self._user_clicks("checkbox", page, name, index=index)

        async def _user_clicks(self, role, page, name, index=None):
            locator = page.get_by_role(role, name=name)

            if index is None:
                return await page.get_by_role(role, name=name).click()

            buttons = await locator.all()
            await buttons[index].click()

        async def user_fills_form_field(self, page, label, value):
            locator = page.get_by_label(label)
            html = await locator.inner_html()

            if html:  # has content so select?
                select = await page.query_selector(f'.mykn-select[title="{label}"]')
                await select.click()
                options = await select.query_selector_all(".mykn-option")

                for option in options:
                    text_content = await option.text_content()
                    if text_content == value:
                        return await option.click()

                return

            await locator.fill(value)

    class Then:
        """
        The "Then" steps specify the expected outcomes or results.
        These steps are used to verify the results of the actions taken in the "When" steps.

        Example:

            async with browser_page() as page:
                await self.then.page_should_contain_text(page, "Vernietigingslijsten")
        """

        def __init__(self, testcase):
            self.testcase = testcase

        async def page_should_contain_text(self, page, text):
            locator = page.get_by_text(text)
            count = await locator.count()
            self.testcase.assertTrue(bool(count), f"{text} not found in {page}")

        async def path_should_be(self, page, path):
            await self.url_should_be(page, self.testcase.live_server_url + path)

        async def url_should_be(self, page, url):
            await expect(page).to_have_url(url)

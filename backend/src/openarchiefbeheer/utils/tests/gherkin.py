import re
from typing import Callable

from asgiref.sync import sync_to_async
from playwright.async_api import expect

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.models import DestructionList
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
)
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

        async def data_exists(self, create_data_fn: Callable):
            await create_data_fn()

        async def assignee_exists(self, **kwargs):
            base_kwargs = {"user": await self.record_manager_exists()}
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self._get_or_create(
                DestructionListAssigneeFactory, **merged_kwargs
            )

        async def record_manager_exists(self, **kwargs):
            base_kwargs = {
                "username": "Record Manager",
                "first_name": "Record",
                "last_name": "Manager",
                "post__can_start_destruction": True,
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self.user_exists(**merged_kwargs)

        async def reviewer_exists(self, **kwargs):
            base_kwargs = {
                "username": "Beoordelaar",
                "first_name": "Beoor",
                "last_name": "del Laar",
                "post__can_review_destruction": True,
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self.user_exists(**merged_kwargs)

        async def archivist_exists(self, **kwargs):
            base_kwargs = {
                "username": "Achivaris",
                "first_name": "Archi",
                "last_name": "Varis",
                "post__can_review_final_list": True,
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self.user_exists(**merged_kwargs)

        async def user_exists(self, **kwargs):
            return await self._get_or_create(
                UserFactory, password="ANic3Password", **kwargs
            )

        async def list_exists(self, **kwargs):
            @sync_to_async()
            def add_items(destruction_list, assignees=[], items=[]):
                if assignees:
                    destruction_list.assignees.set(assignees)

                if items:
                    destruction_list.items.set(items)

            record_manager = await self.record_manager_exists()
            base_kwargs = {
                "name": "My First Destruction List",
                "assignee": record_manager,
                "author": record_manager,
                "zaken": await self.zaken_are_indexed(100),
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            assignees = merged_kwargs.pop("assignees", [])
            zaken = merged_kwargs.pop("zaken", [])

            destruction_list = await self._get_or_create(
                DestructionListFactory, **merged_kwargs
            )

            items = [
                await self.list_item_exists(
                    destruction_list=destruction_list, zaak=zaak
                )
                for zaak in zaken
            ]
            await add_items(destruction_list, assignees, items)
            return destruction_list

        async def list_item_exists(self, **kwargs):
            if not (zaak := kwargs.pop("zaak", None)):
                zaken = await self.zaken_are_indexed(1)
                zaak = zaken[0]

            base_kwargs = {
                "zaak": zaak,
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self._get_or_create(
                DestructionListItemFactory, **merged_kwargs
            )

        async def review_exists(self, **kwargs):
            @sync_to_async()
            def add_items(review, items=None):
                if items:
                    review.item_reviews.set(items)

            base_kwargs = {
                "destruction_list": (
                    await self.list_exists() if "destruction_list" not in kwargs else {}
                )
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            items = merged_kwargs.pop(
                "items",
                [
                    await self.review_item_exists(
                        destruction_list=merged_kwargs["destruction_list"]
                    )
                ],
            )

            review = await self._get_or_create(
                DestructionListReviewFactory, **merged_kwargs
            )
            await add_items(review, items)
            return review

        async def review_item_exists(self, **kwargs):
            @sync_to_async()
            def get_item(merged_kwargs):
                return merged_kwargs["destruction_list"].items.first()

            destruction_list = await self.list_exists()
            base_kwargs = {"destruction_list": destruction_list}
            merged_kwargs = {**base_kwargs, **kwargs}
            item = merged_kwargs.pop("items", await get_item(merged_kwargs))

            return await self._get_or_create(
                DestructionListItemReviewFactory,
                destruction_list_item=item,
                **merged_kwargs,
            )

        async def selectielijstklasse_choices_are_available(self, page):
            async def handle(route):
                json = [
                    {
                        "label": "11.1 - Verleend - vernietigen - P1Y",
                        "value": "https://www.example.com",
                        "detail": {
                            "bewaartermijn": "P5Y",
                        },
                    }
                ]
                await route.fulfill(json=json)

            await page.route("**/*/api/v1/_selectielijstklasse-choices/?zaak=*", handle)

        async def zaken_are_indexed(self, amount, **kwargs):
            return await self._get_or_create_batch(ZaakFactory, amount, **kwargs)

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
                get_kwargs = kwargs.copy()
                if "password" in get_kwargs:
                    get_kwargs.pop("password")

                # Remove any traits/postgeneration attributes of the factory
                orm_params = {
                    key: value
                    for key, value in get_kwargs.items()
                    if key not in factory._meta.parameters
                    and not key.startswith("post__")
                }
                return await self._orm_get(factory._meta.model, **orm_params)
            except factory._meta.model.DoesNotExist:
                return await self._factory_create(factory, **kwargs)

        async def _get_or_create_batch(self, factory, amount, recreate=False, **kwargs):
            # Remove any traits of the factory
            orm_params = {
                key: value
                for key, value in kwargs.items()
                if key not in factory._meta.parameters
            }

            if recreate:
                await factory._meta.model.objects.all().adelete()
                factory.reset_sequence()

            else:
                queryset = await self._orm_filter(factory._meta.model, **orm_params)
                count = queryset.count() if queryset else 0
                if count >= amount:
                    return queryset[:amount]
                return await self._factory_create_batch(
                    factory, amount - count, **kwargs
                )

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

        async def user_logs_in(self, page, user):
            await page.goto(self.testcase.live_server_url)
            await page.wait_for_url(
                f"{self.testcase.live_server_url}/login?next=/destruction-lists"
            )

            await page.get_by_label("Gebruikersnaam").fill(user.username)
            await page.get_by_label("Wachtwoord").fill("ANic3Password")
            await page.get_by_role("button", name="Inloggen").click()

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

        async def user_clicks_button(self, page, name, index=0):
            await self._user_clicks("button", page, name, index=index)

        async def user_clicks_checkbox(self, page, name, index=0):
            await self._user_clicks("checkbox", page, name, index=index)

        async def user_clicks_radio(self, page, name, index=0):
            await self._user_clicks("radio", page, name, index=index)

        async def user_selects_zaak(self, page, identificatie):
            locator = page.get_by_role(
                "row", name=f"(de)selecteer rij {identificatie}"
            ).get_by_label("(de)selecteer rij")
            await locator.click()

        async def _user_clicks(self, role, page, name, index=0):
            locator = page.get_by_role(role, name=name)
            await locator.first.wait_for()
            elements = await locator.all()
            element = elements[index]
            await element.wait_for()
            await element.click()

        async def user_fills_form_field(self, page, label, value, role=None, index=0):
            selects = await page.query_selector_all(f'.mykn-select[title="{label}"]')
            try:
                select = selects[index]

                if select:  # has content so select?
                    await select.click()
                    options = await select.query_selector_all(".mykn-option")

                    for option in options:
                        text_content = await option.text_content()
                        if text_content == value:
                            return await option.click()

                    return
            except IndexError:
                pass

            if role:
                locator = page.get_by_label(label).and_(page.get_by_role("textbox"))
            else:
                locator = page.get_by_label(label)

            elements = await locator.all()
            await elements[index].fill(value)

        async def user_filters_zaken(self, page, name, value):
            locator = page.get_by_role("textbox", name=name)
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

        @property
        def not_(self):
            class InvertedThen:
                def __init__(self, then):
                    self.then = then

                def __getattr__(self, item):
                    method = getattr(self.then, item)

                    async def inverted_method(*args, **kwargs):
                        try:
                            await method(*args, **kwargs)
                        except AssertionError:
                            return

                        raise AssertionError(
                            f'Expected {method.__name__} to raise an AssertionError due to "not_".'
                        )

                    return inverted_method

            return InvertedThen(self)

        async def list_should_exist(self, page, name):
            @sync_to_async()
            def get_list():
                return DestructionList.objects.get(name=name)

            return await get_list()

        async def list_should_have_assignee(self, page, destruction_list, assignee):
            @sync_to_async()
            def refresh_list():
                destruction_list.refresh_from_db()

            @sync_to_async()
            def get_assignee():
                return destruction_list.assignee

            await refresh_list()
            list_assignee = await get_assignee()
            self.testcase.assertEqual(list_assignee, assignee)

        async def list_should_have_status(self, page, destruction_list, status):
            @sync_to_async()
            def refresh_list():
                destruction_list.refresh_from_db()

            await refresh_list()
            self.testcase.assertEqual(destruction_list.status, status)

        async def list_should_have_number_of_items(
            self, destruction_list, number_of_items
        ):
            @sync_to_async()
            def get_number_of_items():
                return destruction_list.items.count()

            count = await get_number_of_items()
            self.testcase.assertEqual(number_of_items, count)

        async def page_should_contain_text(self, page, text):
            locator = page.get_by_text(text).nth(0)
            await expect(locator).to_be_visible()

        async def path_should_be(self, page, path):
            await self.url_should_be(page, self.testcase.live_server_url + path)

        async def url_should_be(self, page, url):
            await expect(page).to_have_url(url)

        async def url_should_contain_text(self, page, text):
            await expect(page).to_have_url(re.compile(text))

        async def zaak_should_be_selected(
            self, page, identificatie, template="(de)selecteer rij"
        ):
            locator = page.get_by_role("row", name=identificatie).get_by_label(
                template.format(identificatie=identificatie)
            )
            await expect(locator).to_be_checked()

        async def zaak_should_not_be_selected(
            self, page, identificatie, template="(de)selecteer rij"
        ):
            locator = page.get_by_role("row", name=identificatie).get_by_label(
                template.format(identificatie=identificatie)
            )
            await expect(locator).not_to_be_checked()

        async def zaaktype_filters_are(self, page, expected_filters):
            select = page.get_by_label('filter veld "zaaktype"')

            await select.click()

            dropdown = await select.get_by_role("listbox").all_inner_texts()
            labels = dropdown[0].rstrip("\n").split("\n")

            self.testcase.assertEqual(labels, expected_filters)

        async def this_number_of_zaken_should_be_visible(self, page, number):
            locator = page.get_by_role("grid")
            rows = await locator.locator("tbody").locator("tr").all()

            self.testcase.assertEqual(len(rows), number)

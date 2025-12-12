import re
from typing import Callable

from asgiref.sync import sync_to_async
from playwright.async_api import Locator, Page, TimeoutError, expect
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.destruction.models import DestructionList
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
    ReviewItemResponseFactory,
)
from openarchiefbeheer.selection.models import AllSelectedToggle, SelectionItem
from openarchiefbeheer.selection.tests.factories import SelectionItemFactory
from openarchiefbeheer.utils.tests.e2e import PlaywrightTestCase
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tests.factories import ZaakFactory


class GerkinMixin:
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

        def __init__(self, testcase: PlaywrightTestCase):
            self.testcase = testcase

        async def data_exists(self, create_data_fn: Callable):
            await create_data_fn()

        async def services_are_configured(
            self,
            m,
            zaaktypen: list | None = None,
            statustypen: list | None = None,
            resultaattypen: list | None = None,
            informatieobjecttypen: list | None = None,
        ):
            """
            Mock Services implementation.

            Args:
                m: requests-mock adapter instance used to mock HTTP requests.
            """
            m.get(
                "http://zaken.nl/catalogi/api/v1/zaaktypen",
                json={"results": zaaktypen or []},
            )
            m.get(
                "http://zaken.nl/catalogi/api/v1/statustypen",
                json={"results": statustypen or []},
            )
            m.get(
                "http://zaken.nl/catalogi/api/v1/resultaattypen",
                json={"results": resultaattypen or []},
            )
            m.get(
                "http://zaken.nl/catalogi/api/v1/informatieobjecttypen",
                json={"results": informatieobjecttypen or []},
            )

            await self._get_or_create(
                ServiceFactory,
                api_root="http://zaken.nl/besluiten/api/v1/",
                api_type=APITypes.brc,
            )
            await self._get_or_create(
                ServiceFactory,
                api_root="http://zaken.nl/documenten/api/v1/",
                api_type=APITypes.drc,
            )
            await self._get_or_create(
                ServiceFactory,
                api_root="http://zaken.nl/api/v1/",
                api_type=APITypes.orc,
            )
            await self._get_or_create(
                ServiceFactory,
                api_root="http://zaken.nl/zaken/api/v1/",
                api_type=APITypes.zrc,
            )
            await self._get_or_create(
                ServiceFactory,
                api_root="http://zaken.nl/catalogi/api/v1/",
                api_type=APITypes.ztc,
            )

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

        async def co_reviewer_exists(self, **kwargs):
            base_kwargs = {
                "username": "co-beoordelaar",
                "first_name": "Co",
                "last_name": "Beoordelaar",
                "post__can_co_review_destruction": True,
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

        async def administrator_exists(self, **kwargs):
            base_kwargs = {
                "username": "administrator",
                "first_name": "Admi",
                "last_name": "Nistrator",
                "post__can_review_final_list": True,
                "post__can_start_destruction": True,
                "post__can_review_destruction": True,
                "post__can_co_review_destruction": True,
                "post__can_configure_application": True,
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            return await self.user_exists(**merged_kwargs)

        async def user_exists(self, **kwargs):
            return await self._get_or_create(
                UserFactory, password="ANic3Password", **kwargs
            )

        async def list_exists(self, **kwargs):
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

            if assignees:
                await destruction_list.assignees.aset(assignees)
            else:
                await self._get_or_create(
                    DestructionListAssigneeFactory,
                    destruction_list=destruction_list,
                    user=destruction_list.assignee,
                )

            if items:
                await destruction_list.items.aset(items)

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

            if items:
                await review.item_reviews.aset(items)

            return review

        async def review_item_exists(self, **kwargs):
            destruction_list = await self.list_exists()
            base_kwargs = {"destruction_list": destruction_list}
            merged_kwargs = {**base_kwargs, **kwargs}
            item = merged_kwargs.pop(
                "items", await merged_kwargs["destruction_list"].items.afirst()
            )

            return await self._get_or_create(
                DestructionListItemReviewFactory,
                destruction_list_item=item,
                **merged_kwargs,
            )

        async def review_item_response_exists(self, **kwargs):
            return await self._factory_create(ReviewItemResponseFactory, **kwargs)

        async def informatieobjecttype_choices_are_available(self, page):
            async def handle(route):
                json = [
                    {
                        "label": "Informatie object type 1",
                        "value": "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/b0b28783-052d-414a-867d-81cf52725506",
                    },
                    {
                        "label": "Informatie object type 2",
                        "value": "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/3007e984-c529-4a07-b32e-555b4c882ce5",
                    },
                    {
                        "label": "Informatie object type 3",
                        "value": "http://zaken.nl/catalogi/api/v1/informatieobjecttypen/b25201a6-2d1e-42ca-bff6-417ce5b4cb4a",
                    },
                ]
                await route.fulfill(json=json)

            await page.route("**/*/api/v1/_informatieobjecttype-choices/*", handle)

        async def resultaattype_choices_are_available(self, page):
            async def handle(route):
                json = [
                    {
                        "label": "Resultaattype 1",
                        "value": "http://zaken.nl/catalogi/api/v1/resultaattypen/73c8a575-c75c-4c97-ba1f-42c3180ced04",
                    },
                    {
                        "label": "Resultaattype 2",
                        "value": "http://zaken.nl/catalogi/api/v1/resultaattypen/2af00ef7-d865-4166-9efc-19ab95fed618",
                    },
                    {
                        "label": "Resultaattype 3",
                        "value": "http://zaken.nl/catalogi/api/v1/resultaattypen/6436c0b9-156a-4e71-8aab-0e03cca85cc6",
                    },
                ]
                await route.fulfill(json=json)

            await page.route("**/*/api/v1/_external-resultaattype-choices/*", handle)

        async def selectielijstklasse_choices_are_available(self, page):
            async def handle(route):
                json = [
                    {
                        "label": "1.1 - Ingericht - vernietigen - P10Y",
                        "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/afa30940-855b-4a7e-aa21-9e15a8078814",
                        "extraData": {
                            "bewaartermijn": "P10Y",
                        },
                    },
                    {
                        "label": "1.1.1 - Ingericht - blijvend_bewaren",
                        "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/8af64c99-a168-40dd-8afd-9fbe0597b6dc",
                        "extraData": {
                            "bewaartermijn": None,
                        },
                    },
                    {
                        "label": "1.1.2 - Ingericht - blijvend_bewaren",
                        "value": "https://selectielijst.openzaak.nl/api/v1/resultaten/e84a06ac-1bdc-4e9c-9598-a22faa562459",
                        "extraData": {
                            "bewaartermijn": None,
                        },
                    },
                ]
                await route.fulfill(json=json)

            await page.route("**/*/api/v1/_selectielijstklasse-choices/*", handle)
            await page.route(
                "**/*/api/v1/_internal-selectielijstklasse-choices/*", handle
            )

        async def behandelende_afdeling_choices_are_available(self, page):
            async def handle(route):
                json = [
                    {
                        "label": "Afdeling 1",
                        "value": "http://zaken.nl/catalogi/api/v1/behandelende-afdelingen/0e4f8c3e-2d9f-4a7b-b5d3-4d6b5a0f8b9c",
                    },
                    {
                        "label": "Afdeling 1",
                        "value": "http://zaken.nl/catalogi/api/v1/behandelende-afdelingen/0e4f8c3e-2d9f-4a7b-b5d3-4d6b5a0f8b9c",
                    },
                    {
                        "label": "Afdeling 1",
                        "value": "http://zaken.nl/catalogi/api/v1/behandelende-afdelingen/0e4f8c3e-2d9f-4a7b-b5d3-4d6b5a0f8b9c",
                    },
                ]
                await route.fulfill(json=json)

            await page.route(
                "**/*/api/v1/_retrieve-behandelend-afdeling-choices-choices/*", handle
            )

        async def statustype_choices_are_available(self, page):
            async def handle(route):
                json = [
                    {
                        "label": "Statustype 1",
                        "value": "http://zaken.nl/catalogi/api/v1/statustypen/feedf256-ef74-4d5f-8fc9-6891f58a0d1e",
                    },
                    {
                        "label": "Statustype 2",
                        "value": "http://zaken.nl/catalogi/api/v1/statustypen/0b016f1a-e10a-4dad-9090-c06bac6ef7e7",
                    },
                    {
                        "label": "Statustype 3",
                        "value": "http://zaken.nl/catalogi/api/v1/statustypen/155d0b58-c97d-4451-ab0c-a1fdbe65317c",
                    },
                ]
                await route.fulfill(json=json)

            await page.route("**/*/api/v1/_statustype-choices/*", handle)

        async def zaaktype_choices_are_available(self, page):
            async def handle(route):
                json = [
                    {
                        "label": "Aangifte behandelen 1",
                        "value": "ZAAKTYPE-01",
                        "extra": "",
                    },
                    {
                        "label": "Aangifte behandelen 2",
                        "value": "ZAAKTYPE-02",
                        "extra": "",
                    },
                    {
                        "label": "Aangifte behandelen 3",
                        "value": "ZAAKTYPE-03",
                        "extra": "",
                    },
                ]
                await route.fulfill(json=json)

            await page.route("**/*/api/v1/_zaaktypen-choices/*", handle)

        async def external_zaaktype_choices_are_available(self, page):
            async def handle(route):
                json = [
                    {
                        "label": "Aangifte behandelen 1",
                        "value": "ZAAKTYPE-01",
                        "extra": "",
                    },
                    {
                        "label": "Aangifte behandelen 2",
                        "value": "ZAAKTYPE-02",
                        "extra": "",
                    },
                    {
                        "label": "Aangifte behandelen 3",
                        "value": "ZAAKTYPE-03",
                        "extra": "",
                    },
                ]
                await route.fulfill(json=json)

            await page.route("**/*/api/v1/_external-zaaktypen-choices/*", handle)

        async def zaken_are_indexed(self, amount, **kwargs) -> list[Zaak]:
            return await self._get_or_create_batch(ZaakFactory, amount, **kwargs)

        async def zaak_selection_api_is_empty(self):
            await SelectionItem.objects.all().adelete()
            await AllSelectedToggle.objects.all().adelete()

        async def zaak_selection_exists(
            self, zaken_amount: int, **kwargs
        ) -> list[SelectionItem]:
            return await self._factory_create_batch(
                SelectionItemFactory, zaken_amount, **kwargs
            )

        async def configuration_short_procedure_exists(
            self, zaaktypen_short_procedure: list[str]
        ) -> None:
            @sync_to_async()
            def set_short_procedure_zaaktypen(zaaktypen: list[str]) -> None:
                ArchiveConfig.clear_cache()
                config = ArchiveConfig.get_solo()
                config.zaaktypes_short_process = zaaktypen
                config.save()

            await set_short_procedure_zaaktypen(zaaktypen_short_procedure)

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
                return await factory._meta.model.objects.aget(**orm_params)
            except factory._meta.model.DoesNotExist:
                return await self._factory_create(factory, **kwargs)

        async def _get_or_create_batch(self, factory, amount, recreate=False, **kwargs):
            # Remove any traits of the factory
            orm_params = {
                key: value
                for key, value in kwargs.items()
                if key not in factory._meta.parameters and not key.startswith("post__")
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

        def __init__(self, testcase: PlaywrightTestCase):
            self.testcase = testcase

        async def user_logs_in(self, page, user):
            await self._user_logs_in(page, user.username, "ANic3Password")

        async def record_manager_logs_in(self, page, **kwargs):
            base_kwargs = {
                "username": "Record Manager",
                "password": "ANic3Password",
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            await self._user_logs_in(
                page, merged_kwargs["username"], merged_kwargs["password"]
            )

        async def reviewer_logs_in(self, page, **kwargs):
            base_kwargs = {
                "username": "Beoordelaar",
                "password": "ANic3Password",
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            await self._user_logs_in(
                page, merged_kwargs["username"], merged_kwargs["password"]
            )

        async def co_reviewer_logs_in(self, page, **kwargs):
            base_kwargs = {
                "username": "co-beoordelaar",
                "password": "ANic3Password",
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            await self._user_logs_in(
                page, merged_kwargs["username"], merged_kwargs["password"]
            )

        async def archivist_logs_in(self, page, **kwargs):
            base_kwargs = {
                "username": "Achivaris",
                "password": "ANic3Password",
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            await self._user_logs_in(
                page, merged_kwargs["username"], merged_kwargs["password"]
            )

        async def administrator_logs_in(self, page, **kwargs):
            base_kwargs = {
                "username": "administrator",
                "password": "ANic3Password",
            }
            merged_kwargs = {**base_kwargs, **kwargs}
            await self._user_logs_in(
                page, merged_kwargs["username"], merged_kwargs["password"]
            )

        async def _user_logs_in(self, page, username, password="ANic3Password"):
            await self.user_logs_out(page)
            await page.goto(f"{self.testcase.live_server_url}/login")
            await page.get_by_label("Gebruikersnaam").fill(username)
            await page.get_by_label("Wachtwoord").fill(password)
            await page.get_by_role("button", name="Inloggen").click()

        async def user_logs_out(self, page):
            await page.goto(f"{self.testcase.live_server_url}/logout")

        async def user_clicks_button(self, page, name, index=0):
            await self._user_clicks("button", page, name, index=index)

        async def user_clicks_link(self, page, name, index=0):
            await self._user_clicks("link", page, name, index=index)

        async def user_clicks_checkbox(self, page, name, index=0):
            await self._user_clicks("checkbox", page, name, index=index)

        async def user_clicks_radio(self, page, name, index=0):
            await self._user_clicks("radio", page, name, index=index)

        async def user_selects_zaak(self, page, identificatie, timeout=None):
            locator = page.get_by_role(
                "row", name=f"(de)selecteer rij {identificatie}"
            ).get_by_label("(de)selecteer rij")
            await locator.wait_for(timeout=timeout)
            await locator.click()

        async def _user_clicks(self, role: str, page: Page, name: str, index=0):
            await page.wait_for_load_state("networkidle")

            locator = page.get_by_role(role, name=name, exact=False)
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
                locator = page.get_by_label(label).and_(page.get_by_role(role))
            else:
                locator = page.get_by_label(label).and_(page.get_by_role("textbox"))

            elements = await locator.all()
            await elements[index].fill(value)

        async def user_filters_zaken(self, page, name, value):
            locator = page.get_by_label(f'filter veld "{name}"')
            # Check if it is a dropdown
            element_role = await locator.get_attribute("role")
            if element_role == "combobox":
                await locator.click()

                options = await page.query_selector_all(".mykn-option")

                for option in options:
                    text_content = await option.text_content()
                    if text_content != value:
                        continue

                    return await option.click()

            # It's not a dropdown, it's a textbox then
            return await locator.fill(value)

    class Then:
        """
        The "Then" steps specify the expected outcomes or results.
        These steps are used to verify the results of the actions taken in the "When" steps.

        Example:

            async with browser_page() as page:
                await self.then.page_should_contain_text(page, "Vernietigingslijsten")
        """

        # This indicates that the test is inverted (not_), this can be used to optimize tests.
        is_inverted = False

        def __init__(self, testcase: PlaywrightTestCase):
            self.testcase = testcase

        @property
        def not_(self):
            class InvertedThen:
                def __init__(self, then):
                    self.then = then
                    self.then.is_inverted = True

                def __getattr__(self, item):
                    method = getattr(self.then, item)

                    async def inverted_method(*args, **kwargs):
                        try:
                            await method(*args, **kwargs)
                        except (AssertionError, TimeoutError):
                            return

                        raise AssertionError(
                            f'Expected {method.__name__} to raise an AssertionError due to "not_".'
                        )

                    return inverted_method

            return InvertedThen(self)

        async def archive_configuration_should_be(self, page, **kwargs):
            # Add minor delay (0.1s) to allow the database to update.
            await page.wait_for_timeout(100)

            @sync_to_async()
            def get_archive_config():
                ArchiveConfig.clear_cache()
                return ArchiveConfig.get_solo()

            archive_config = await get_archive_config()
            await archive_config.arefresh_from_db()

            for key, value in kwargs.items():
                self.testcase.assertEqual(getattr(archive_config, key), value)

        async def list_should_exist(self, page, name: str):
            try:
                return await DestructionList.objects.aget(name=name)
            except DestructionList.DoesNotExist as exc:
                raise AssertionError(
                    f"Destruction list with name '{name}' does not exist."
                ) from exc

        async def list_should_have_assignee(self, page, destruction_list, assignee):
            @sync_to_async()
            def get_assignee():
                return destruction_list.assignee

            await destruction_list.arefresh_from_db()
            list_assignee = await get_assignee()
            self.testcase.assertEqual(list_assignee, assignee)

        async def list_should_have_user_in_assignees(
            self, page, destruction_list, assignee
        ):
            await destruction_list.arefresh_from_db()
            list_assignee = await destruction_list.assignees.aget(user__pk=assignee.pk)
            self.testcase.assertTrue(list_assignee)

        async def list_should_have_status(
            self, page, destruction_list: DestructionList, status: str
        ):
            await destruction_list.arefresh_from_db()
            self.testcase.assertEqual(destruction_list.status, status)

        async def list_should_have_processing_status(
            self, page, destruction_list: DestructionList, processing_status: str
        ):
            await destruction_list.arefresh_from_db()
            self.testcase.assertEqual(
                destruction_list.processing_status, processing_status
            )

        async def list_should_have_number_of_items(
            self, destruction_list, number_of_items
        ):
            count = await destruction_list.items.acount()
            self.testcase.assertEqual(number_of_items, count)

        async def zaken_should_have_order(self, page: Page, zaken: list[str]):
            await page.wait_for_load_state("networkidle")
            locators: list[Locator] = [
                await self.page_should_contain_text(page, z) for z in zaken
            ]
            await self.locators_should_have_order(page, locators)

        async def locators_should_have_order(self, page: Page, locators: list[Locator]):
            for i in range(len(locators) - 1):
                locator_a = locators[i]
                locator_b = locators[i + 1]

                bbox_a = await locator_a.bounding_box()
                bbox_b = await locator_b.bounding_box()

                ypos_a = bbox_a["y"]
                ypos_b = bbox_b["y"]

                self.testcase.assertLess(ypos_a, ypos_b)

        async def page_should_contain_text(self, page, text, timeout=None):
            if timeout is None:
                timeout = 500 if self.is_inverted else 10000

            # Wait for the text to appear in the DOM
            await page.wait_for_selector(f"text={text}", timeout=timeout)

            # Confirm the element with the text is visible
            element = page.locator(f"text={text}").nth(0)
            await expect(element).to_be_visible(timeout=timeout)
            return element

        async def page_should_not_contain_text(self, page, text, timeout=None):
            if timeout is None:
                timeout = 500 if self.is_inverted else 10000

            # Check if the text is not present within the timeout
            element = page.locator(f"text={text}")
            await expect(element).to_have_count(0, timeout=timeout)

        async def page_should_contain_element_with_title(
            self, page, title, timeout=5000
        ):
            element = page.get_by_title(title)
            await expect(element).to_be_visible(timeout=timeout)

        async def path_should_be(self, page, path, timeout=None):
            await self.url_should_be(
                page, self.testcase.live_server_url + path, timeout=timeout
            )

        async def button_should_be_enabled(self, page, name, index=0):
            element = page.get_by_role("button", name=name)
            await expect(element).to_be_enabled()

        async def button_should_be_disabled(self, page, name, index=0):
            element = page.get_by_role("button", name=name)
            await expect(element).to_be_disabled()

        async def form_field_should_have_value(
            self, page, label, value, role=None, index=0
        ):
            selects = await page.query_selector_all(
                f'.mykn-select[aria-label="{label}"]'
            )
            try:
                select = selects[index]

                if select:  # has content so select?
                    raise NotImplementedError("Selects are not supported yet")
            except IndexError:
                pass

            if role:
                locator = page.get_by_label(label).and_(page.get_by_role("textbox"))
            else:
                locator = page.get_by_label(label)

            elements = await locator.all()
            await expect(elements[index]).to_have_value(value)

        async def url_regex_should_be(self, page, regex_path):
            await expect(page).to_have_url(re.compile(regex_path))

        async def url_should_be(self, page, url, timeout=None):
            await expect(page).to_have_url(url, timeout=timeout)

        async def url_should_contain_text(self, page, text):
            await expect(page).to_have_url(re.compile(text))

        async def zaak_should_be_selected(
            self, page, identificatie, template="(de)selecteer rij"
        ):
            locator = page.get_by_role("row", name=identificatie).get_by_label(
                template.format(identificatie=identificatie)
            )
            await expect(locator).to_be_checked(
                timeout=10000
            )  # Attempt to fix flakiness?

        async def zaak_should_not_be_selected(
            self, page, identificatie, template="(de)selecteer rij"
        ):
            locator = page.get_by_role("row", name=identificatie).get_by_label(
                template.format(identificatie=identificatie)
            )
            await expect(locator).not_to_be_checked()

        async def zaaktype_filters_are(self, page, expected_filters):
            select = page.get_by_label('filter veld "zaaktype"')
            dropdown = select.get_by_role("listbox")

            if not await dropdown.last.is_visible():
                await select.click()

            options = await dropdown.all_inner_texts()
            labels = options[0].rstrip("\n").split("\n")

            self.testcase.assertEqual(labels, expected_filters)

        async def this_number_of_zaken_should_be_visible(self, page, number):
            locator = page.get_by_role("grid").locator("tbody").locator("tr")

            await expect(locator).to_have_count(number)

        async def input_field_should_be_empty(self, page, placeholder):
            locator = page.get_by_placeholder(placeholder)
            await expect(locator).to_have_value("")

        async def dropdown_should_be_empty(self, page, name):
            select = page.get_by_label(f'filter veld "{name}"')
            value = await select.get_attribute("value")
            self.testcase.assertEqual(value, None)


class GherkinLikeTestCase(GerkinMixin, PlaywrightTestCase):
    pass

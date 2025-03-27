from django.test import tag

from openarchiefbeheer.destruction.constants import ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
@tag("gh-635")
class Issue635FiltersReset(GherkinLikeTestCase):
    async def when_user_navigates_to_page_with_filter(self, page):
        await self.given.selectielijstklasse_choices_are_available(page)
        await self.given.behandelende_afdeling_choices_are_available(page)
        zaken = await self.given.zaken_are_indexed(amount=500)
        record_manager = await self.given.record_manager_exists()

        await self.given.list_exists(
            name="Destruction list to reset filters for",
            status=ListStatus.ready_to_review,
            uuid="00000000-0000-0000-0000-000000000000",
            zaken=zaken,
        )

        await self.when.user_logs_in(page, record_manager)
        await self.then.path_should_be(page, "/destruction-lists")
        await self.when.user_clicks_button(
            page, "Destruction list to reset filters for"
        )
        await self.then.url_should_contain_text(page, "destruction-lists/")

    async def when_user_selects_filter_dropdown_by_index(self, page, name, index):
        locator = page.get_by_label(f'filter veld "{name}"')
        await locator.click()
        options = await page.query_selector_all(".mykn-option")
        for option in options:
            if options.index(option) == index:
                return await option.click()
            return None
        return None

    async def when_user_types_in_date(self, page, title, placeholder, dd, mm, jjjj):
        divs = await page.query_selector_all(f'div[title="{title}"]')

        for div in divs:
            first_input = await div.query_selector(
                f'input[placeholder="{placeholder}"]'
            )

            # If we found the correct input, type into the fields
            if first_input:
                dd_f = await div.query_selector('input[placeholder="dd"]')
                mm_f = await div.query_selector('input[placeholder="mm"]')
                jjjj_f = await div.query_selector('input[placeholder="jjjj"]')

                await dd_f.type(dd)
                await mm_f.type(mm)
                await jjjj_f.type(jjjj)
                await jjjj_f.press("Tab")  # To blur the input field
                return  # Once we find and fill the inputs, we can exit the loop

        raise LookupError(
            f"No div with title '{title}' and first input placeholder '{placeholder}' found."
        )

    async def then_date_field_should_be_empty(self, page, title, placeholder):
        # Check that the date field is empty
        divs = await page.query_selector_all(f'div[title="{title}"]')

        for div in divs:
            first_input = await div.query_selector(
                f'input[placeholder="{placeholder}"]'
            )
            # If we found the correct input, check if the value is empty
            if first_input:
                value = await first_input.get_attribute("value")
                self.assertEqual(value, "")
                return

        raise LookupError(
            f"No div with title '{title}' and first input placeholder '{placeholder}' found."
        )

    async def test_reset(self):
        async with browser_page() as page:
            await self.when_user_navigates_to_page_with_filter(page)

            # Zaaktype
            await self.when_user_selects_filter_dropdown_by_index(page, "Zaaktype", 0)
            await self.then.url_should_contain_text(page, "zaaktype")

            # Selectielijstklasse
            await self.when.user_filters_zaken(
                page, "Selectielijstklasse", "1.1 - Ingericht - vernietigen - P10Y"
            )
            await self.then.url_should_contain_text(page, "selectielijstklasse")

            # Identificatie
            await self.when.user_filters_zaken(page, "Identificatie", "some text")
            await self.then.url_should_contain_text(page, "identificatie__icontains")

            # Omschrijving
            await self.when.user_filters_zaken(page, "omschrijving", "some text")
            await self.then.url_should_contain_text(page, "omschrijving__icontains")

            # Behandelende afdeling
            await self.when_user_selects_filter_dropdown_by_index(
                page, "Behandelende afdeling", 0
            )
            await self.then.url_should_contain_text(
                page, "behandelend_afdeling__icontains"
            )

            # Startdatum
            await self.when_user_types_in_date(
                page, "startdatum", "Startdatum", "01", "01", "2021"
            )
            await self.when_user_types_in_date(
                page, "einddatum", "Startdatum", "01", "01", "2022"
            )
            await self.then.url_should_contain_text(page, "startdatum__gte")
            await self.then.url_should_contain_text(page, "startdatum__lte")

            # EindDatum
            await self.when_user_types_in_date(
                page, "startdatum", "Einddatum", "01", "01", "2021"
            )
            await self.when_user_types_in_date(
                page, "einddatum", "Einddatum", "01", "01", "2022"
            )
            await self.then.url_should_contain_text(page, "einddatum__gte")
            await self.then.url_should_contain_text(page, "einddatum__lte")

            # Archiefactiedatum
            await self.when_user_types_in_date(
                page, "startdatum", "Archiefactiedatum", "01", "01", "2021"
            )
            await self.when_user_types_in_date(
                page, "einddatum", "Archiefactiedatum", "01", "01", "2022"
            )
            await self.then.url_should_contain_text(page, "archiefactiedatum__gte")
            await self.then.url_should_contain_text(page, "archiefactiedatum__lte")

            # Reset
            await self.when.user_clicks_button(page, "Filters wissen")

            await self.then.path_should_be(
                page,
                "/destruction-lists/00000000-0000-0000-0000-000000000000/review?page=1",
            )

            await self.then.input_field_should_be_empty(page, "Identificatie")
            await self.then.dropdown_should_be_empty(page, "Zaaktype")
            await self.then.input_field_should_be_empty(page, "Omschrijving")
            # await self.then.input_field_should_be_empty(page, "Behandelende afdeling")
            await self.then_date_field_should_be_empty(page, "startdatum", "Startdatum")
            await self.then_date_field_should_be_empty(page, "einddatum", "Startdatum")
            await self.then_date_field_should_be_empty(page, "startdatum", "Einddatum")
            await self.then_date_field_should_be_empty(page, "einddatum", "Einddatum")
            await self.then_date_field_should_be_empty(
                page, "startdatum", "Archiefactiedatum"
            )
            await self.then_date_field_should_be_empty(
                page, "einddatum", "Archiefactiedatum"
            )

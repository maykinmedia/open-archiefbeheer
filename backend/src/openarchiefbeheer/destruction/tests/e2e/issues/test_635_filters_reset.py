# fmt: off
from django.test import tag
from openarchiefbeheer.destruction.constants import ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
@tag("gh-635")
class Issue635FiltersReset(GherkinLikeTestCase):
    async def test_scenario_reset_button_works(self):
        async with browser_page() as page:
            zaken = await self.given.zaken_are_indexed(amount=500)
            record_manager = await self.given.record_manager_exists()
            await self.given.selectielijstklasse_choices_are_available(page)

            await self.given.list_exists(
                name="Destruction list to reset filters for",
                status=ListStatus.ready_to_review,
                zaken=zaken,
            )

            await self.when.user_logs_in(page, record_manager)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_clicks_button(page, "Destruction list to reset filters for")
            await self.then.url_should_contain_text(page, "destruction-lists/")
            initial_url_with_page = page.url + "?page=1"
            await self.when.user_clicks_button(page, "Volgende")
            await self.then.url_should_contain_text(page, "page=2")
            await self.then.page_should_not_contain_text(page, "Filters wissen")

            # Testing `Identificatie` filter
            await self.when.user_filters_zaken(page, "Identificatie", "some text")
            await self.then.url_should_contain_text(page, "identificatie__icontains")
            await self.when.user_clicks_button(page, "Filters wissen")
            await self.then.input_field_should_be_empty(page, "Identificatie")

            # Testing `Zaaktype` filter
            await self.when.user_filters_zaken_on_dropdown(page, "Zaaktype", "Aangifte behandelen (ZAAKTYPE-01)")
            await self.then.url_should_contain_text(page, "zaaktype")
            await self.when.user_clicks_button(page, "Filters wissen")
            await self.then.dropdown_should_be_empty(page, "Zaaktype")

            # Testing `Omschrijving` filter
            await self.when.user_filters_zaken(page, "omschrijving", "some text")
            await self.then.url_should_contain_text(page, "omschrijving__icontains")
            await self.when.user_clicks_button(page, "Filters wissen")
            await self.then.input_field_should_be_empty(page, "Omschrijving")

            # Testing `Behandelende afdeling` filter
            # TODO: Fix, FAULTY -> Value stays in the input field after filtering
            await self.when.user_filters_zaken(page, "Behandelende afdeling", "Afdeling 1")
            await self.then.url_should_contain_text(page, "behandelend_afdeling__icontains")
            await self.when.user_clicks_button(page, "Filters wissen")
            await self.then.input_field_should_be_empty(page, "Behandelende afdeling")

            # Testing `Selectielijstklasse` filter
            # TODO: Fix, FAULTY -> No Filters Wissen is present after filter value is set
            await self.when.user_filters_zaken_on_dropdown(page, "Selectielijstklasse", "1.1 - Ingericht - vernietigen - P10Y")
            await self.then.url_should_contain_text(page, "selectielijstklasse")
            await self.when.user_clicks_button(page, "Filters wissen")
            await self.then.dropdown_should_be_empty(page, "Selectielijstklasse")
            

            # Testing `Resultaat` filter 
            await self.when.user_filters_zaken(page, "Resultaat", "some text")
            await self.then.url_should_contain_text(page, "resultaat__resultaattype__omschrijving__icontains")
            await self.when.user_clicks_button(page, "Filters wissen")
            await self.then.input_field_should_be_empty(page, "Resultaat")

            # # Testing `Startdatum` Filter
            # # TODO -> Fix, FAULTY -> Value seems to be a little buggy and "re-appears" after clearing
            # await type_in_date(page, "startdatum", "Startdatum", "01", "01", "2021")
            # await type_in_date(page, "einddatum", "Startdatum", "01", "01", "2022")
            # await self.when.user_clicks_button(page, "Filters wissen")
            # await page.wait_for_timeout(1000) # Needed due to it taking a little bit for the inputs to be cleared
            # await date_field_should_be_empty(page, "startdatum", "Startdatum")
            # await date_field_should_be_empty(page, "einddatum", "Startdatum")

            # Testing `Einddatum` Filter
            await type_in_date(page, "startdatum", "Einddatum", "01", "01", "2021")
            await type_in_date(page, "einddatum", "Einddatum", "01", "01", "2022")
            await self.when.user_clicks_button(page, "Filters wissen")
            await page.wait_for_timeout(1000) # Needed due to it taking a little bit for the inputs to be cleared
            await date_field_should_be_empty(page, "startdatum", "Einddatum")
            await date_field_should_be_empty(page, "einddatum", "Einddatum")

            # Testing `Archiefactiedatum` Filter
            await type_in_date(page, "startdatum", "Archiefactiedatum", "01", "01", "2021")
            await type_in_date(page, "einddatum", "Archiefactiedatum", "01", "01", "2022")
            await self.when.user_clicks_button(page, "Filters wissen")
            await page.wait_for_timeout(1000) # Needed due to it taking a little bit for the inputs to be cleared
            await date_field_should_be_empty(page, "startdatum", "Archiefactiedatum")
            await date_field_should_be_empty(page, "einddatum", "Archiefactiedatum")

            await self.then.url_should_be(page, initial_url_with_page)



async def type_in_date(page, title, placeholder, dd, mm, jjjj):
    divs = await page.query_selector_all(f'div[title="{title}"]')

    for div in divs:
        first_input = await div.query_selector(f'input[placeholder="{placeholder}"]')

        # If we found the correct input, type into the fields
        if first_input:
            dd_f = await div.query_selector('input[placeholder="dd"]')
            mm_f = await div.query_selector('input[placeholder="mm"]')
            jjjj_f = await div.query_selector('input[placeholder="jjjj"]')

            await dd_f.type(dd)
            await mm_f.type(mm)
            await jjjj_f.type(jjjj)
            await jjjj_f.press('Tab') # To blur the input field
            return  # Once we find and fill the inputs, we can exit the loop

    raise ValueError(f"No div with title '{title}' and first input placeholder '{placeholder}' found.")



async def date_field_should_be_empty(page, title, placeholder):
    # Check that the date field is empty
    divs = await page.query_selector_all(f'div[title="{title}"]')

    for div in divs:
        first_input = await div.query_selector(f'input[placeholder="{placeholder}"]')
        # If we found the correct input, check if the value is empty
        if first_input:
            value = await first_input.get_attribute("value")
            assert value == "", f"Expected empty date field, got '{value}' instead."
            return
        
    raise ValueError(f"No div with title '{title}' and first input placeholder '{placeholder}' found.")
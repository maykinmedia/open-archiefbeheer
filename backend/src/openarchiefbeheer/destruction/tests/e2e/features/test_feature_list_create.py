# fmt: off
from django.test import tag

from asgiref.sync import sync_to_async

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ...factories import DestructionListItemFactory


@tag("e2e")
class FeatureListCreateTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_creates_list(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.given.reviewer_exists(username="Beoordelaar")
            await self.given.zaken_are_indexed(100)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.when.user_clicks_checkbox(page, "(de)selecteer rij", index=0)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", index=1)
            await self.when.user_fills_form_field(page, "Naam", "Destruction list to create")
            await self.when.user_fills_form_field(page, "Reviewer", "Beoordelaar")
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to create")

    async def test_scenario_reviewer_cannot_create_list(self):
        async with browser_page() as page:
            await self.given.reviewer_exists()
            await self.given.zaken_are_indexed(100)

            await self.when.reviewer_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/login?next=/destruction-lists/create")

    async def test_scenario_archivist_cannot_create_list(self):
        async with browser_page() as page:
            await self.given.archivist_exists()
            await self.given.zaken_are_indexed(100)

            await self.when.archivist_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/login?next=/destruction-lists/create")

    async def test_zaaktype_filters_on_create_page(self):
           
        @sync_to_async
        def create_data():
            ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-01", 
                        "omschrijving": "ZAAKTYPE-01", 
                        "versiedatum": "2024-01-01", 
                        "url": "http://catalogue-api.nl/zaaktypen/111-111-111"
                    }
                }, 
            )
            ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-02", 
                        "omschrijving": "ZAAKTYPE-02", 
                        "versiedatum": "2024-01-01", 
                        "url": "http://catalogue-api.nl/zaaktypen/222-222-222"
                    }
                }, 
            )
            ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-03", 
                        "omschrijving": "ZAAKTYPE-03", 
                        "versiedatum": "2024-01-01", 
                        "url": "http://catalogue-api.nl/zaaktypen/333-333-333"
                    }
                }, 
            )
            zaak = ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-05", 
                        "omschrijving": "ZAAKTYPE-05", 
                        "versiedatum": "2024-01-01", 
                        "url": "http://catalogue-api.nl/zaaktypen/555-555-555"
                    }
                }, 
            )
            DestructionListItemFactory.create(zaak=zaak)
        
        async with browser_page() as page:
            await self.given.data_exists(create_data)
            await self.given.record_manager_exists()
            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/destruction-lists/create")
            await self.then.zaaktype_filters_are(page, [
                "ZAAKTYPE-01 (ZAAKTYPE-01)", 
                "ZAAKTYPE-02 (ZAAKTYPE-02)", 
                "ZAAKTYPE-03 (ZAAKTYPE-03)"
            ])

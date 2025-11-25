# fmt: off
import datetime

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
            reviewer = await self.given.reviewer_exists(username="Beoordelaar")
            await self.given.zaken_are_indexed(100)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.when.user_clicks_checkbox(page, "(de)selecteer rij", index=0)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", index=1)
            await self.when.user_fills_form_field(page, "Naam", "Destruction list to create")
            await self.when.user_fills_form_field(page, "Reviewer", str(reviewer))
            await self.when.user_fills_form_field(page, "Toelichting", "I comment.")
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to create")

    async def test_scenario_record_manager_cannot_create_existing_list(self):
        async with browser_page([]) as page:  # Silence (debug) warning.
            await self.given.record_manager_exists()
            reviewer = await self.given.reviewer_exists(username="Beoordelaar")
            await self.given.zaken_are_indexed(200)
            await self.given.list_exists(name="Existing destruction list")

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.when.user_clicks_checkbox(page, "(de)selecteer rij", index=0)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", index=1)
            await self.when.user_fills_form_field(page, "Naam", "Existing destruction list")
            await self.when.user_fills_form_field(page, "Reviewer", str(reviewer))
            await self.when.user_fills_form_field(page, "Toelichting", "I comment.")
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)

            await self.then.page_should_contain_text(page, "Foutmelding")
            await self.then.page_should_contain_text(page, "Er bestaat al een vernietigingslijst met dezelfde naam")

    async def test_scenario_reviewer_cannot_create_list(self):
        async with browser_page() as page:
            await self.given.reviewer_exists()
            await self.given.zaken_are_indexed(100)

            await self.when.reviewer_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.not_.page_should_contain_text(page, "Vernietigingslijst opstellen")

    async def test_scenario_archivist_cannot_create_list(self):
        async with browser_page() as page:
            await self.given.archivist_exists()
            await self.given.zaken_are_indexed(100)

            await self.when.archivist_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.not_.page_should_contain_text(page, "Vernietigingslijst opstellen")

    async def test_zaaktype_filters_on_create_page(self):
        @sync_to_async
        def create_data():
            ZaakFactory.create(
                identificatie="ZAAK-000-1",
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
                identificatie="ZAAK-000-2",
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
                identificatie="ZAAK-111-1",
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-03",
                        "omschrijving": "ZAAKTYPE-03",
                        "versiedatum": "2024-01-01",
                        "url": "http://catalogue-api.nl/zaaktypen/333-333-333"
                    }
                },
            )

            # This zaaktype should not be shown as its only zaak gets assigned to a destruction list.
            zaak = ZaakFactory.create(
                identificatie="ZAAK-111-2",
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-04",
                        "omschrijving": "ZAAKTYPE-04",
                        "versiedatum": "2024-01-01",
                        "url": "http://catalogue-api.nl/zaaktypen/444-444-444"
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

            await self.when.user_filters_zaken(page, "identificatie", "ZAAK-000")
            await self.then.path_should_be(page, "/destruction-lists/create?identificatie__icontains=ZAAK-000&page=1")
            await self.then.this_number_of_zaken_should_be_visible(page, 2)
            await self.then.zaaktype_filters_are(page, [
                "ZAAKTYPE-01 (ZAAKTYPE-01)",
                "ZAAKTYPE-02 (ZAAKTYPE-02)"
            ])

    async def test_zaaktype_filters_on_selectielijstklasse_create_page(self):
        @sync_to_async
        def create_data():
            ZaakFactory.create(
                identificatie="ZAAK-1",
                # The selectielijstklasse is set directly on the zaak
                selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/afa30940-855b-4a7e-aa21-9e15a8078814",
            )
            ZaakFactory.create(
                identificatie="ZAAK-2",
                # The selectielijstklasse is NOT set on the zaak, so we look at the resultaat->resultaattype->selectielijstklasse
                selectielijstklasse="",
                post___expand={
                    "resultaat": {
                        "resultaattype": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                        "_expand": {
                            "resultaattype": {
                                "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                                "omschrijving": "resultaattype 111-111-111",
                                "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/8af64c99-a168-40dd-8afd-9fbe0597b6dc",
                            }
                        },
                    }
                },
            )
            ZaakFactory.create(
                identificatie="ZAAK-3",
                # The selectielijstklasse overwrites the selectielijstklasse of the resultaat->resultaattype->selectielijstklasse
                selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/e84a06ac-1bdc-4e9c-9598-a22faa562459",
                post___expand={
                    "resultaat": {
                        "resultaattype": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                        "_expand": {
                            "resultaattype": {
                                "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                                "omschrijving": "resultaattype 111-111-111",
                                "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/8af64c99-a168-40dd-8afd-9fbe0597b6dc",
                            }
                        },
                    }
                },
            )

        async with browser_page() as page:
            await self.given.data_exists(create_data)
            await self.given.record_manager_exists()
            await self.given.selectielijstklasse_choices_are_available(page)

            await self.when.record_manager_logs_in(page)

            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")

            await self.then.path_should_be(page, "/destruction-lists/create")
            await self.then.page_should_contain_text(page, "1.1 - Ingericht - vernietigen - P10Y")
            await self.then.page_should_contain_text(page, "1.1.1 - Ingericht - blijvend_bewaren")
            await self.then.page_should_contain_text(page, "1.1.2 - Ingericht - blijvend_bewaren")

            await self.when.user_filters_zaken(page, "selectielijstklasse", "1.1 - Ingericht - vernietigen - P10Y")

            await self.then.this_number_of_zaken_should_be_visible(page, 1)
            await self.then.page_should_contain_text(page, "ZAAK-1")

            await self.when.user_filters_zaken(page, "selectielijstklasse", "1.1.1 - Ingericht - blijvend_bewaren")

            await self.then.this_number_of_zaken_should_be_visible(page, 1)
            await self.then.page_should_contain_text(page, "ZAAK-2")

            await self.when.user_filters_zaken(page, "selectielijstklasse", "1.1.2 - Ingericht - blijvend_bewaren")

            await self.then.this_number_of_zaken_should_be_visible(page, 1)
            await self.then.page_should_contain_text(page, "ZAAK-3")

    async def test_scenario_filter_expired_archive_date(self):
        @sync_to_async
        def create_data():
            today = datetime.date.today()
            yesterday = today - datetime.timedelta(days=1)
            tomorrow = today + datetime.timedelta(days=1)

            ZaakFactory.create(identificatie="ZAAK-1", archiefactiedatum=yesterday)
            ZaakFactory.create(identificatie="ZAAK-2", archiefactiedatum=today)
            ZaakFactory.create(identificatie="ZAAK-3", archiefactiedatum=tomorrow)

        async with browser_page() as page:
            await self.given.data_exists(create_data)
            await self.given.record_manager_exists()

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.then.page_should_contain_text(page, "Zaak-1")
            await self.then.page_should_contain_text(page, "Zaak-2")
            await self.then.page_should_contain_text(page, "Zaak-3")

            await self.when.user_clicks_button(page, "Toon zaken met verlopen archiefdatum")
            await self.then.page_should_contain_text(page, "Filters wissen")
            await self.then.page_should_not_contain_text(page, "Toon zaken met verlopen archiefdatum")
            await self.then.page_should_contain_text(page, "Zaak-1")
            await self.then.page_should_contain_text(page, "Zaak-2")
            await self.then.page_should_not_contain_text(page, "Zaak-3")

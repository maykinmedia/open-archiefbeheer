# fmt: off
from django.test import tag

from asgiref.sync import sync_to_async

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ...factories import DestructionListFactory, DestructionListItemFactory


@tag("e2e")
class FeatureListEditTests(GherkinLikeTestCase):
    async def test_scenario_user_edits_multi_page_destruction_list(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.given.zaken_are_indexed(300, recreate=True)
            reviewer = await self.given.reviewer_exists()

            # Create destruction list
            await self.when.record_manager_logs_in(page)

            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 0)
            await self.then.path_should_be(page, "/destruction-lists/create")
            await self.then.page_should_contain_text(page, "zaak-99")

            await self.when.user_clicks_button(page, "volgende")
            await self.then.path_should_be(page, "/destruction-lists/create?page=2")
            await self.then.page_should_contain_text(page, "zaak-199")

            await self.when.user_clicks_checkbox(page, "(de)selecteer 100 rijen")  # All zaken on second page

            await self.when.user_clicks_button(page, "volgende")
            await self.then.path_should_be(page, "/destruction-lists/create?page=3")
            await self.then.page_should_contain_text(page, "zaak-299")

            await self.when.user_selects_zaak(page, "ZAAK-200")  # First zaak on third (last) page (ZAAK-200)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 1)

            await self.when.user_fills_form_field(page, "Naam", "Destruction list to edit")
            await self.when.user_fills_form_field(page, "Reviewer", str(reviewer))
            await self.when.user_fills_form_field(page, "Toelichting", "Masterpiece of a list")
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)
            await self.then.path_should_be(page, "/destruction-lists")

            # View destruction list
            destruction_list = await self.then.list_should_exist(page, "Destruction list to edit")
            await self.when.user_clicks_button(page, "Destruction list to edit")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit")

            await self.when.user_clicks_button(page, "2")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit?page=2")
            await self.then.page_should_contain_text(page, "ZAAK-200")

            # Add "ZAAK-0" (The first unselected zaak)
            await self.when.user_clicks_button(page, "Bewerken", 2)
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit?page=1&is_editing=true")
            await self.then.page_should_contain_text(page, "zaak-199")

            await self.when.user_clicks_button(page, "Volgende")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit?page=2&is_editing=true")
            await self.then.zaak_should_be_selected(page, "ZAAK-200")

            await self.when.user_selects_zaak(page, "ZAAK-0", timeout=6000)
            await self.when.user_clicks_button(page, "Vernietigingslijst aanpassen")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit")

            # View updated destruction list
            await self.then.page_should_contain_text(page, "ZAAK-0") # The new zaak has a the smallest pk, so it is at the start of the list

            # Remove "ZAAK-0"
            await self.when.user_clicks_button(page, "Bewerken", 2)
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit?page=1&is_editing=true")
            await self.then.zaak_should_be_selected(page, "ZAAK-0")  # Zaak that we are going to remove

            await self.when.user_clicks_button(page, "Volgende")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit?page=2&is_editing=true")
            await self.then.zaak_should_be_selected(page, "ZAAK-200")

            await self.when.user_clicks_button(page, "Ga naar de eerste pagina (pagina 1)")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit?page=1&is_editing=true")
            await self.when.user_selects_zaak(page, "ZAAK-0")
            await self.when.user_clicks_button(page, "Vernietigingslijst aanpassen")
            await self.then.path_should_be(page, f"/destruction-lists/{str(destruction_list.uuid)}/edit")

            # View updated destruction list
            await self.then.page_should_contain_text(page, "ZAAK-199")
            await self.when.user_clicks_button(page, "Volgende")
            await self.then.not_.page_should_contain_text(page, "ZAAK-0")

    async def test_zaaktype_filter(self):
        @sync_to_async
        def create_data():
            record_manager = UserFactory.create(
                username="record_manager", password="ANic3Password", post__can_start_destruction=True
            )
            destruction_list = DestructionListFactory.create(
                name="Destruction list to filter",
                assignee=record_manager,
                author=record_manager,
                uuid="00000000-0000-0000-0000-000000000000",
                status=ListStatus.new

            )
            zaak1 = ZaakFactory.create(
                identificatie="ZAAK-000-1",
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-01",
                        "omschrijving": "ZAAKTYPE-01",
                        "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        },
                        "versiedatum": "2024-01-01"
                    }
                },
            )
            zaak2 = ZaakFactory.create(
                identificatie="ZAAK-000-2",
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-02",
                        "omschrijving": "ZAAKTYPE-02",
                        "url": "http://catalogue-api.nl/zaaktypen/222-222-222",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        },
                        "versiedatum": "2024-01-01"
                    }
                },
            )
            zaak3 = ZaakFactory.create(
                identificatie="ZAAK-111-1",
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-03",
                        "omschrijving": "ZAAKTYPE-03",
                        "url": "http://catalogue-api.nl/zaaktypen/333-333-333",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        },
                        "versiedatum": "2024-01-01"
                    }
                },
            )
            zaak4 = ZaakFactory.create(
                identificatie="ZAAK-111-2",
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-04",
                        "omschrijving": "ZAAKTYPE-04",
                        "url": "http://catalogue-api.nl/zaaktypen/444-444-444",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        },
                        "versiedatum": "2024-01-01"
                    }
                },
            )

            DestructionListItemFactory.create(zaak=zaak1, destruction_list=destruction_list)
            DestructionListItemFactory.create(zaak=zaak2, destruction_list=destruction_list)
            DestructionListItemFactory.create(zaak=zaak3, destruction_list=destruction_list)
            DestructionListItemFactory.create(zaak=zaak4, destruction_list=destruction_list)

            self.destruction_list = destruction_list

        async with browser_page() as page:
            await self.given.data_exists(create_data)
            await self.when.record_manager_logs_in(page, **{
                "username": "record_manager",
                "password": "ANic3Password",
            })
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, self.destruction_list.name)
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit")
            await self.when.user_clicks_button(page, "Bewerken", 1)
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?page=1&is_editing=true")
            # Initially the filters are for all zaaktypes
            await self.then.zaaktype_filters_are(page, [
                "ZAAKTYPE-01 (ZAAKTYPE-01)",
                "ZAAKTYPE-02 (ZAAKTYPE-02)",
                "ZAAKTYPE-03 (ZAAKTYPE-03)",
                "ZAAKTYPE-04 (ZAAKTYPE-04)",
            ])
            # If filtering first on identificatie, the zaaktype filters change
            await self.when.user_filters_zaken(page, "identificatie", "ZAAK-000")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?page=1&is_editing=true&identificatie__icontains=ZAAK-000")
            await self.then.this_number_of_zaken_should_be_visible(page, 2)
            await self.then.zaaktype_filters_are(page, [
                "ZAAKTYPE-01 (ZAAKTYPE-01)",
                "ZAAKTYPE-02 (ZAAKTYPE-02)"
            ])

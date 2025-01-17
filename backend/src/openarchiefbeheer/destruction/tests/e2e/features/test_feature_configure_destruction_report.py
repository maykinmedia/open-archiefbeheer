# fmt: off
from django.test import tag

import requests_mock

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
@tag("gh-553")
class FeatureConfigureDestructionReport(GherkinLikeTestCase):
    async def test_scenario_configure_destruction_report(self):
        async with browser_page() as page:
            with requests_mock.Mocker() as m:
                await self.given.services_are_configured(m)
                await self.given.record_manager_exists()
                await self.given.informatieobjecttype_choices_are_available(page)
                await self.given.resultaattype_choices_are_available(page)
                await self.given.selectielijstklasse_choices_are_available(page)
                await self.given.statustype_choices_are_available(page)
                await self.given.external_zaaktype_choices_are_available(page)

                await self.when.record_manager_logs_in(page)
                await self.then.path_should_be(page, "/destruction-lists")
                await self.when.user_clicks_button(page, "Instellingen")
                await self.when.user_clicks_button(page, "Vernietigingsrapport")
                await self.then.path_should_be(page, "/settings/destruction-report")

                await self.when.user_fills_form_field(page, "Bronorganisatie", "000000001")
                await self.when.user_fills_form_field(page, "Zaaktype", "Aangifte behandelen 2")
                await self.when.user_fills_form_field(page, "Statustype", "Statustype 2")
                await self.when.user_fills_form_field(page, "Resultaattype", "Resultaattype 2")
                await self.when.user_fills_form_field(page, "Informatieobjecttype", "Informatie object type 2")
                await self.when.user_fills_form_field(page, "Selectielijstklasse", "1.1.1 - Ingericht - blijvend_bewaren")
                await self.when.user_clicks_button(page, "Opslaan")

                await self.then.page_should_contain_text(page, "De instellingen zijn succesvol opgeslagen")
                await self.then.archive_configuration_should_be(
                    page,
                    bronorganisatie="000000001",
                    zaaktype="http://localhost:8000/catalogi/api/v1/zaaktypen/927eb71c-d99b-4c5d-b3e2-94a07ce85923",
                    statustype="http://zaken.nl/catalogi/api/v1/statustypen/0b016f1a-e10a-4dad-9090-c06bac6ef7e7",
                    resultaattype="http://zaken.nl/catalogi/api/v1/resultaattypen/2af00ef7-d865-4166-9efc-19ab95fed618",
                    informatieobjecttype="http://zaken.nl/catalogi/api/v1/informatieobjecttypen/3007e984-c529-4a07-b32e-555b4c882ce5",
                    selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/8af64c99-a168-40dd-8afd-9fbe0597b6dc",
                )

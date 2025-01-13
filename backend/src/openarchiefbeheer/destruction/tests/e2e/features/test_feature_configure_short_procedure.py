# fmt: off

from django.test import tag

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
class FeatureConfigureShortProcedure(GherkinLikeTestCase):
    async def test_scenario_configure_short_procedure(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.given.zaaktype_choices_are_available(page)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Instellingen")
            await self.when.user_clicks_button(page, "Verkorte procedure")
            await self.then.path_should_be(page, "/settings/short-procedure")

            await self.when.user_clicks_checkbox(page, "(de)selecteer rij", 1)
            await self.when.user_clicks_checkbox(page, "(de)selecteer rij", 2)
            await self.when.user_clicks_button(page, "Opslaan")

            await self.then.page_should_contain_text(page, "De instellingen zijn succesvol opgeslagen, 2 zaaktypen toegevoegd van de verkorte procedure.")
            await self.then.archive_configuration_should_be(
                page,
                zaaktypes_short_process=[
                    "http://localhost:8000/catalogi/api/v1/zaaktypen/927eb71c-d99b-4c5d-b3e2-94a07ce85923",
                    "http://localhost:8000/catalogi/api/v1/zaaktypen/684b9c68-a36f-4c72-b044-fa9cdcb17ec9",
                ],
            )

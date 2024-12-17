# fmt: off
from django.test import tag

from openarchiefbeheer.destruction.constants import ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


@tag("e2e")
@tag("gh-446")
class Issue446ConfirmRemoveExclusion(GherkinLikeTestCase):
    async def test_scenario_user_approves_and_deselects_single_item(self):
        async with browser_page() as page:
            await self.given.zaak_selection_api_is_empty()
            zaken = await self.given.zaken_are_indexed(3)
            reviewer = await self.given.reviewer_exists()

            await self.given.list_exists(
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
                uuid="00000000-0000-0000-0000-000000000000",
                assignee=reviewer,
                zaken=zaken
            )

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to review")

            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")
            await self.when.user_clicks_button(page, "Accorderen", 0)
            await self.then.zaak_should_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Geaccordeerd")
            await self.when.user_clicks_checkbox(page, "Markeren als (on)gezien", 0)
            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")

            await self.then.page_should_contain_text(page, "Goedkeuren")

    async def test_scenario_user_approves_and_deselects_all_items_individually(self):
        async with browser_page() as page:
            await self.given.zaak_selection_api_is_empty()
            zaken = await self.given.zaken_are_indexed(3)
            reviewer = await self.given.reviewer_exists()

            await self.given.list_exists(
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
                uuid="00000000-0000-0000-0000-000000000000",
                assignee=reviewer,
                zaken=zaken
            )

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to review")

            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")
            await self.when.user_clicks_button(page, "Accorderen", 0)
            await self.then.zaak_should_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Geaccordeerd")
            await self.when.user_clicks_checkbox(page, "Markeren als (on)gezien", 0)
            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")

            await self.then.zaak_should_not_be_selected(page, zaken[1].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")
            await self.when.user_clicks_button(page, "Accorderen", 1)
            await self.then.zaak_should_be_selected(page, zaken[1].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Geaccordeerd")
            await self.when.user_clicks_checkbox(page, "Markeren als (on)gezien", 1)
            await self.then.zaak_should_not_be_selected(page, zaken[1].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")

            await self.then.zaak_should_not_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")
            await self.when.user_clicks_button(page, "Accorderen", 2)
            await self.then.zaak_should_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Geaccordeerd")
            await self.when.user_clicks_checkbox(page, "Markeren als (on)gezien", 2)
            await self.then.zaak_should_not_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")

            await self.then.page_should_contain_text(page, "Goedkeuren")

    async def test_scenario_user_excludes_and_deselects_single_item(self):
        async with browser_page() as page:
            await self.given.zaak_selection_api_is_empty()
            zaken = await self.given.zaken_are_indexed(3)
            reviewer = await self.given.reviewer_exists()

            await self.given.list_exists(
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
                uuid="00000000-0000-0000-0000-000000000000",
                assignee=reviewer,
                zaken=zaken
            )

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to review")

            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")

            await self.when.user_clicks_button(page, "Uitzonderen", 0)
            await self.when.user_fills_form_field(page, "Reden", "gh-446")
            await self.when.user_clicks_button(page, "Zaak uitzonderen")

            await self.then.zaak_should_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Uitgezonderd")
            await self.then.page_should_contain_text(page, "Afwijzen")

            await self.when.user_clicks_checkbox(page, "Markeren als (on)gezien", 0)
            await self.then.page_should_contain_text(page, "Weet je zeker dat je de beoordeling wilt verwijderen?")

            await self.when.user_clicks_button(page, "Verwijderen")
            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")
            await self.then.page_should_contain_text(page, "Goedkeuren")

    async def test_scenario_user_excludes_and_keeps_single_item(self):
        async with browser_page() as page:
            await self.given.zaak_selection_api_is_empty()
            zaken = await self.given.zaken_are_indexed(3)
            reviewer = await self.given.reviewer_exists()

            await self.given.list_exists(
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
                uuid="00000000-0000-0000-0000-000000000000",
                assignee=reviewer,
                zaken=zaken
            )

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to review")

            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Niet beoordeeld")

            await self.when.user_clicks_button(page, "Uitzonderen", 0)
            await self.when.user_fills_form_field(page, "Reden", "gh-446")
            await self.when.user_clicks_button(page, "Zaak uitzonderen")

            await self.then.zaak_should_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Uitgezonderd")
            await self.then.page_should_contain_text(page, "Afwijzen")

            await self.when.user_clicks_checkbox(page, "Markeren als (on)gezien", 0)
            await self.then.page_should_contain_text(page, "Weet je zeker dat je de beoordeling wilt verwijderen?")

            await self.when.user_clicks_button(page, "Annuleren")
            await self.then.zaak_should_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.page_should_contain_text(page, "Uitgezonderd")
            await self.then.page_should_contain_text(page, "Afwijzen")

    async def test_scenario_user_approves_and_deselects_all_items_in_batch(self):
        async with browser_page() as page:
            await self.given.zaak_selection_api_is_empty()
            zaken = await self.given.zaken_are_indexed(3)
            reviewer = await self.given.reviewer_exists()

            await self.given.list_exists(
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
                uuid="00000000-0000-0000-0000-000000000000",
                assignee=reviewer,
                zaken=zaken
            )

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to review")

            await self.when.user_clicks_checkbox(page, "Alles als (on)gezien markeren")
            await self.then.zaak_should_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_be_selected(page, zaken[1].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")

            await self.when.user_clicks_checkbox(page, "Alles als (on)gezien markeren")
            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_not_be_selected(page, zaken[1].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_not_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")

            await self.then.page_should_contain_text(page, "Goedkeuren")

    async def test_scenario_user_approves_items_hybrid(self):
        async with browser_page() as page:
            await self.given.zaak_selection_api_is_empty()
            zaken = await self.given.zaken_are_indexed(3)
            reviewer = await self.given.reviewer_exists()

            await self.given.list_exists(
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
                uuid="00000000-0000-0000-0000-000000000000",
                assignee=reviewer,
                zaken=zaken
            )

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to review")

            await self.when.user_clicks_button(page, "Accorderen")
            await self.when.user_clicks_checkbox(page, "Alles als (on)gezien markeren")

            await self.then.zaak_should_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_be_selected(page, zaken[1].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")

            await self.when.user_clicks_checkbox(page, "Alles als (on)gezien markeren")
            await self.then.zaak_should_not_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_not_be_selected(page, zaken[1].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_not_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")

            await self.then.page_should_contain_text(page, "Goedkeuren")

    async def test_scenario_user_approves_and_deselect_unexcluded_items_in_batch(self):
        async with browser_page() as page:
            await self.given.zaak_selection_api_is_empty()
            zaken = await self.given.zaken_are_indexed(3)
            reviewer = await self.given.reviewer_exists()

            await self.given.list_exists(
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
                uuid="00000000-0000-0000-0000-000000000000",
                assignee=reviewer,
                zaken=zaken
            )

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to review")

            await self.when.user_clicks_button(page, "Uitzonderen", 2)
            await self.when.user_fills_form_field(page, "Reden", "gh-446")
            await self.when.user_clicks_button(page, "Zaak uitzonderen")
            await self.then.page_should_contain_text(page, "Uitgezonderd", timeout=10000)

            await self.when.user_clicks_checkbox(page, "Alles als (on)gezien markeren")
            await self.then.zaak_should_be_selected(page, zaken[0].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_be_selected(page, zaken[1].identificatie, "Markeren als (on)gezien")
            await self.then.zaak_should_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")

            await self.then.page_should_contain_text(page, "Geaccordeerd", timeout=10000)
            await self.then.page_should_contain_text(page, "Afwijzen", timeout=10000)

            await self.when.user_clicks_checkbox(page, "Alles als (on)gezien markeren")
            await self.then.zaak_should_be_selected(page, zaken[2].identificatie, "Markeren als (on)gezien")

            await self.then.page_should_contain_text(page, "Niet beoordeeld", timeout=10000)
            await self.then.page_should_contain_text(page, "Uitgezonderd", timeout=10000)
            await self.then.page_should_contain_text(page, "Afwijzen", timeout=10000)

# fmt: off
from django.test import tag

from playwright.async_api import Page

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import ListStatus
from ....models import DestructionList


@tag("e2e")
@tag("issue")
@tag("gh-843")
class Issue843ProcessAbortCausesUnexpectedResultsTestCase(GherkinLikeTestCase):
    async def _create(self, page: Page):
        await self.given.record_manager_exists(username="gh-843-record-manager")
        reviewer = await self.given.reviewer_exists(username="gh-843-reviewer-1")
        await self.given.zaken_are_indexed(100)

        await self.when.record_manager_logs_in(page, username="gh-843-record-manager")
        await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
        await self.when.user_clicks_checkbox(page, "(de)selecteer rij", index=0)
        await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", index=1)
        await self.when.user_fills_form_field(page, "Naam", "gh-843-destruction-list")
        await self.when.user_fills_form_field(page, "Reviewer", str(reviewer))
        await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)

        await self.then.path_should_be(page, "/destruction-lists")
        return await self.then.list_should_exist(page, "gh-843-destruction-list")

    async def _ready_to_review(self, page: Page, destruction_list: DestructionList):
        await self.when.record_manager_logs_in(page, username="gh-843-record-manager")
        await self.when.user_clicks_button(page, "gh-843-destruction-list")
        await self.when.user_clicks_button(page, "Ter beoordeling indienen")
        await self.when.user_clicks_button(page, "Ter beoordeling indienen", 1)

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_to_review)

        return destruction_list

    async def _review_by_reviewer(self, page: Page, destruction_list: DestructionList, username="gh-843-reviewer-1"):
        await self.when.reviewer_logs_in(page, username=username)
        await self.when.user_clicks_button(page, "gh-843-destruction-list")
        await self.when.user_clicks_button(page, "Goedkeuren")
        await self.when.user_fills_form_field(page, "Opmerking", "gh-843")
        await self.when.user_clicks_button(page, "Vernietigingslijst goedkeuren")

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.internally_reviewed)

    async def _finalize(self, page: Page, destruction_list: DestructionList, username="gh-843-archivist-1"):
        archivaris = await self.given.archivist_exists(username=username)

        await self.when.record_manager_logs_in(page, username="gh-843-record-manager")
        await self.when.user_clicks_button(page, "gh-843-destruction-list")
        await self.when.user_clicks_button(page, "Markeren als definitief")
        await self.when.user_fills_form_field(page, "Archivaris", str(archivaris))
        await self.when.user_fills_form_field(page, "Opmerking", "Dit is een test comment")
        await self.when.user_clicks_button(page, "Markeer als definitief")

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_for_archivist)

    async def _review_by_archivist(self, page: Page, destruction_list: DestructionList, username="gh-843-archivist-1"):
        await self.when.archivist_logs_in(page, username=username)
        await self.when.user_clicks_button(page, "gh-843-destruction-list")
        await self.when.user_clicks_button(page, "Goedkeuren")
        await self.when.user_fills_form_field(page, "Opmerking", "gh-843")
        await self.when.user_clicks_button(page, "Vernietigingslijst goedkeuren")

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_to_delete)

    async def _schedule_destroy(self, page: Page, destruction_list: DestructionList):
        await self.when.record_manager_logs_in(page, username="gh-843-record-manager")
        await self.when.user_clicks_button(page, "gh-843-destruction-list")
        await self.when.user_clicks_button(page, "Vernietigen starten")
        await self.when.user_fills_form_field(page, "Type naam van de lijst ter bevestiging", "gh-843-destruction-list")
        await self.when.user_clicks_button(page, "1 zaken vernietigen")

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_to_delete)

    async def _abort_process(self, page: Page, destruction_list: DestructionList):
        await self.when.record_manager_logs_in(page, username="gh-843-record-manager")
        await self.when.user_clicks_button(page, "gh-843-destruction-list")
        await self.when.user_clicks_button(page, "Vernietigen annuleren")
        await self.when.user_fills_form_field(page, "Opmerking", "gh-843")
        await self.when.user_clicks_button(page, "Vernietiging annuleren")

        await destruction_list.arefresh_from_db()
        await self.then.path_should_be(page, f"/destruction-lists/{destruction_list.uuid}/edit")

        # Delay to allow creation of assignee.
        await self.when.user_clicks_button(page, "Home")
        await self.then.path_should_be(page, "/destruction-lists")

        await self.then.list_should_have_status(page, destruction_list, ListStatus.new)

    async def _reassign(self, page: Page, destruction_list: DestructionList):
        reviewer2 = await self.given.reviewer_exists(username="gh-843-reviewer-2")

        await self.when.record_manager_logs_in(page, username="gh-843-record-manager")
        await self.when.user_clicks_button(page, "gh-843-destruction-list")
        await self.when.user_clicks_button(page, "Beoordelaar bewerken")
        await self.when.user_fills_form_field(page, "Beoordelaar", "Beoor del Laar (gh-843-reviewer-2)")
        await self.when.user_fills_form_field(page, "Reden", "gh-843")
        await self.when.user_clicks_button(page, "Toewijzen")

        await self.then.page_should_not_contain_text(page, "Beoordelaar toewijzen")
        await self.then.page_should_contain_text(page, "Beoor del Laar (gh-843-reviewer-2)")
        await self.then.list_should_have_user_in_assignees(page, destruction_list, reviewer2)

    async def test_scenario_create_abort_update(self):
        async with browser_page() as page:
            # First pass
            destruction_list = await self._create(page)
            await self._ready_to_review(page, destruction_list)
            await self._review_by_reviewer(page, destruction_list)
            await self._finalize(page, destruction_list)
            await self._review_by_archivist(page, destruction_list)
            await self._schedule_destroy(page, destruction_list)
            await self._abort_process(page, destruction_list)

            # Second pass
            await self._reassign(page, destruction_list)
            await self._ready_to_review(page, destruction_list)
            await self._review_by_reviewer(page, destruction_list, "gh-843-reviewer-2")
            await self._finalize(page, destruction_list)
            await self._review_by_archivist(page, destruction_list)
            await self._schedule_destroy(page, destruction_list)
            await self._abort_process(page, destruction_list)

            # Third pass
            await self._reassign(page, destruction_list)
            await self._ready_to_review(page, destruction_list)
            await self._review_by_reviewer(page, destruction_list, "gh-843-reviewer-2")
            await self._finalize(page, destruction_list, "gh-843-archivist-2")
            await self._review_by_archivist(page, destruction_list, "gh-843-archivist-2")
            await self._schedule_destroy(page, destruction_list)
            await self._abort_process(page, destruction_list)

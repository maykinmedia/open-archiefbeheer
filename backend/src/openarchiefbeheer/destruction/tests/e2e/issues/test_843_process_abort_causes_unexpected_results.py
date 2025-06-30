# fmt: off
from asyncio import sleep

from django.test import tag
from playwright.async_api import Page

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase

from ....constants import ListStatus, InternalStatus
from ....models import DestructionList, DestructionListAssignee


@tag("e2e")
@tag("gh-843")
class Issue843ProcessAbortCausesUnexpectedResultsTestCase(GherkinLikeTestCase):
    async def _create(self, page: Page):
        await self.given.record_manager_exists()
        reviewer = await self.given.reviewer_exists()
        await self.given.zaken_are_indexed(100)

        await self.when.record_manager_logs_in(page)
        await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
        await self.when.user_clicks_checkbox(page, "(de)selecteer rij", index=0)
        await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", index=1)
        await self.when.user_fills_form_field(page, "Naam", "gh-843")
        await self.when.user_fills_form_field(page, "Reviewer", str(reviewer))
        await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)

        await self.then.path_should_be(page, "/destruction-lists")
        await self.then.list_should_exist(page, "gh-843")

        return await DestructionList.objects.aget(name="gh-843")

    async def _ready_to_review(self, page: Page, destruction_list: DestructionList):
        await self.when.record_manager_logs_in(page)
        await self.when.user_clicks_button(page, "gh-843")
        await self.when.user_clicks_button(page, "Ter beoordeling indienen")
        await self.when.user_clicks_button(page, "Ter beoordeling indienen", 1)

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_to_review)

        return destruction_list

    async def _review_by_reviewer(self, page: Page, destruction_list: DestructionList, username="Beoordelaar"):
        await self.when.reviewer_logs_in(page, username=username)
        await self.when.user_clicks_button(page, "gh-843")
        await self.when.user_clicks_button(page, "Goedkeuren")
        await self.when.user_fills_form_field(page, "Opmerking", "gh-843")
        await self.when.user_clicks_button(page, "Vernietigingslijst goedkeuren")

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.internally_reviewed)

    async def _finalize(self, page: Page, destruction_list: DestructionList, username="Achivaris"):
        archivaris = await self.given.archivist_exists(username=username)

        await self.when.record_manager_logs_in(page)
        await self.when.user_clicks_button(page, "gh-843")
        await self.when.user_clicks_button(page, "Markeren als definitief")
        await self.when.user_fills_form_field(page, "Archivaris", str(archivaris))
        await self.when.user_fills_form_field(page, "Opmerking", "Dit is een test comment")
        await self.when.user_clicks_button(page, "Markeer als definitief")

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_for_archivist)

    async def _review_by_archivist(self, page: Page, destruction_list: DestructionList, username="Achivaris"):
        await self.given.archivist_exists(username=username)
        await self.when.archivist_logs_in(page, username=username)
        await self.when.user_clicks_button(page, "gh-843")
        await self.when.user_clicks_button(page, "Goedkeuren")
        await self.when.user_fills_form_field(page, "Opmerking", "gh-843")
        await self.when.user_clicks_button(page, "Vernietigingslijst goedkeuren")

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_to_delete)

    async def _schedule_destroy(self, page: Page, destruction_list: DestructionList):
        await self.when.record_manager_logs_in(page)
        await self.when.user_clicks_button(page, "gh-843")
        await self.when.user_clicks_button(page, "Vernietigen starten")
        await self.when.user_fills_form_field(page, "Type naam van de lijst ter bevestiging", "gh-843")
        await self.when.user_clicks_button(page, "1 zaken vernietigen")

        await self.then.path_should_be(page, "/destruction-lists")
        await destruction_list.arefresh_from_db()
        await self.then.list_should_have_status(page, destruction_list, ListStatus.ready_to_delete)

    async def _abort_process(self, page: Page, destruction_list: DestructionList):
        await self.when.record_manager_logs_in(page)
        await self.when.user_clicks_button(page, "gh-843")
        await self.when.user_clicks_button(page, "Vernietigen annuleren")
        await self.when.user_fills_form_field(page, "Opmerking", "gh-843")
        await self.when.user_clicks_button(page, "Vernietiging annuleren")

        await destruction_list.arefresh_from_db()
        await self.then.path_should_be(page, f"/destruction-lists/{destruction_list.uuid}/edit")
        await sleep(1)  # FIXME: Better wait for solution?
        await self.then.list_should_have_status(page, destruction_list, ListStatus.new)

    async def _reassign(self, page: Page, destruction_list: DestructionList):
        reviewer2 = await self.given.reviewer_exists(username="Beoordelaar2")

        await self.when.record_manager_logs_in(page)
        await self.when.user_clicks_button(page, "gh-843")
        await self.when.user_clicks_button(page, "Beoordelaar bewerken")
        await self.when.user_fills_form_field(page, "Beoordelaar", str(reviewer2))
        await self.when.user_fills_form_field(page, "Reden", "gh-843")
        await self.when.user_clicks_button(page, "Toewijzen")


        await destruction_list.arefresh_from_db()
        await sleep(3)  # FIXME: Better wait for solution?
        reviewer2_assignee = await DestructionListAssignee.objects.aget(user=reviewer2)
        await self.then.list_should_have_user_in_assignees(page, destruction_list, reviewer2_assignee)

    async def test_create_abort_update(self):
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
            await self._review_by_reviewer(page, destruction_list, "Beoordelaar2")
            await self._finalize(page, destruction_list, "Archivaris2")
            await self._review_by_archivist(page, destruction_list, "Archivaris2")
            await self._schedule_destroy(page, destruction_list)
            await self._abort_process(page, destruction_list)

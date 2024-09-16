# fmt: off
from django.test import tag

from asgiref.sync import sync_to_async

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import ListRole, ListStatus
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ...factories import DestructionListFactory, DestructionListItemFactory


@tag("e2e")
class FeatureListReviewTests(GherkinLikeTestCase):
    async def test_scenario_reviewer_approves_list(self):
        async with browser_page() as page:
            record_manager = await self.given.record_manager_exists()
            reviewer = await self.given.reviewer_exists()
            archivist = await self.given.archivist_exists()

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer, role=ListRole.reviewer),
                await self.given.assignee_exists(user=archivist, role=ListRole.archivist),
            ]

            list = await self.given.list_exists(
                assignee=reviewer,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
            )

            await self.when.reviewer_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to review")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review")

            await self.when.user_clicks_button(page, "Goedkeuren")
            await self.when.user_fills_form_field(page, "Opmerking", "Looks good to me👍🏻")
            await self.when.user_clicks_button(page, "Vernietigingslijst goedkeuren")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to review")
            await self.then.list_should_have_status(page, list, ListStatus.internally_reviewed)

    async def test_scenario_reviewer_rejects_list(self):
        async with browser_page() as page:
            record_manager = await self.given.record_manager_exists()
            reviewer = await self.given.reviewer_exists()
            archivist = await self.given.archivist_exists()

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer, role=ListRole.reviewer),
                await self.given.assignee_exists(user=archivist, role=ListRole.archivist),
            ]

            list = await self.given.list_exists(
                assignee=reviewer,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to review",
                status=ListStatus.ready_to_review,
            )

            await self.when.reviewer_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to review")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review")
            await self.when.user_clicks_button(page, "Uitzonderen")
            await self.when.user_fills_form_field(page, "Reden", "Please reconsider this zaak")
            await self.when.user_clicks_button(page, "Zaak uitzonderen")
            await self.when.user_clicks_button(page, "Afwijzen")
            await self.when.user_fills_form_field(page, "Reden", "Please reconsider the zaak on this list")
            await self.when.user_clicks_button(page, "Vernietigingslijst afwijzen")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to review")
            await self.then.list_should_have_status(page, list, ListStatus.changes_requested)

    async def test_scenario_archivist_approves_list(self):
        async with browser_page() as page:
            record_manager = await self.given.record_manager_exists()
            archivist = await self.given.archivist_exists()

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=archivist, role=ListRole.archivist),
            ]

            list = await self.given.list_exists(
                assignee=archivist,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to review",
                status=ListStatus.ready_for_archivist,
            )

            await self.when.archivist_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to review")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review")

            await self.when.user_clicks_button(page, "Goedkeuren")
            await self.when.user_fills_form_field(page, "Opmerking", "Looks good to me👍🏻")
            await self.when.user_clicks_button(page, "Vernietigingslijst goedkeuren")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to review")
            await self.then.list_should_have_status(page, list, ListStatus.ready_to_delete)

    async def test_scenario_archivist_rejects_list(self):
        async with browser_page() as page:
            record_manager = await self.given.record_manager_exists()
            archivist = await self.given.archivist_exists()

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=archivist, role=ListRole.archivist),
            ]

            list = await self.given.list_exists(
                assignee=archivist,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to review",
                status=ListStatus.ready_for_archivist,
            )

            await self.when.archivist_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to review")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review")
            await self.when.user_clicks_button(page, "Uitzonderen")
            await self.when.user_fills_form_field(page, "Reden", "Please reconsider this zaak")
            await self.when.user_clicks_button(page, "Zaak uitzonderen")
            await self.when.user_clicks_button(page, "Afwijzen")
            await self.when.user_fills_form_field(page, "Reden", "Please reconsider the zaak on this list")
            await self.when.user_clicks_button(page, "Vernietigingslijst afwijzen")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.page_should_contain_text(page, "Destruction list to review")
            await self.then.list_should_have_status(page, list, ListStatus.changes_requested)

    async def test_zaaktype_filters(self):
        @sync_to_async
        def create_data():
            reviewer = UserFactory.create(
                password="ANic3Password", role__can_review_destruction=True
            )
            destruction_list = DestructionListFactory.create(
                assignee=reviewer,
                uuid="00000000-0000-0000-0000-000000000000",
                status=ListStatus.ready_to_review
            )
            zaak1 = ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-01",
                        "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        }
                    }
                },
            )
            DestructionListItemFactory.create(zaak=zaak1, destruction_list=destruction_list)
            zaak2 = ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-02",
                        "url": "http://catalogue-api.nl/zaaktypen/222-222-222",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        }
                    }
                },
            )
            DestructionListItemFactory.create(zaak=zaak2, destruction_list=destruction_list)

            ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-03",
                        "url": "http://catalogue-api.nl/zaaktypen/333-333-333",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        }
                    }
                },
            )
            zaak5 = ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-05",
                        "url": "http://catalogue-api.nl/zaaktypen/555-555-555",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        }
                    }
                },
            )
            DestructionListItemFactory.create(zaak=zaak5)  # Different destruction list

            self.destruction_list = destruction_list

        async with browser_page() as page:
            await self.given.data_exists(create_data)
            await self.when.user_logs_in(page, self.destruction_list.assignee)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, self.destruction_list.name)
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review")
            
            await self.then.zaaktype_filters_are(page, ["ZAAKTYPE-01", "ZAAKTYPE-02"])

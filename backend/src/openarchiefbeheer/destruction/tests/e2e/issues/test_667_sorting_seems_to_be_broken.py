# fmt: off
from django.test import tag

from asgiref.sync import sync_to_async

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import (
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
)
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
)
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.zaken.tests.factories import ZaakFactory


@tag("e2e")
@tag("issue")
@tag("gh-667")
class Issue667CancelFilteredEditMode(GherkinLikeTestCase):
    async def test_scenario_sort_destruction_list_create_page(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.given.zaken_are_indexed(amount=3, recreate=True)

            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/create?ordering=identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/create?ordering=-identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-2", "ZAAK-1", "ZAAK-0"])

    async def test_scenario_sort_destruction_list_detail_page(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            zaken = await self.given.zaken_are_indexed(amount=3, recreate=True)
            await self.given.list_exists(
                name="Destruction list to sort",
                status=ListStatus.new,
                uuid="00000000-0000-0000-0000-000000000000",
                zaken=zaken)

            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to sort")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?ordering=identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?ordering=-identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-2", "ZAAK-1", "ZAAK-0"])

    async def test_scenario_sort_destruction_list_edit_page(self):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            zaken = await self.given.zaken_are_indexed(amount=10, recreate=True, omschrijving="Destruction list to sort")
            await self.given.list_exists(
                name="Destruction list to sort",
                status=ListStatus.new,
                uuid="00000000-0000-0000-0000-000000000000",
                zaken=zaken[:2])

            await self.when.record_manager_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to sort")
            await self.when.user_clicks_button(page, "Bewerken", 2)
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?page=1&is_editing=true")
            await self.when.user_fills_form_field(page, "Omschrijving", "Destruction list to sort")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?page=1&is_editing=true&omschrijving__icontains=Destruction+list+to+sort")

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?page=1&is_editing=true&omschrijving__icontains=Destruction+list+to+sort&ordering=identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/edit?page=1&is_editing=true&omschrijving__icontains=Destruction+list+to+sort&ordering=-identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-2", "ZAAK-1", "ZAAK-0"])

    async def test_scenario_sort_destruction_list_review_page(self):
        async with browser_page() as page:
            record_manager = await self.given.record_manager_exists()
            reviewer = await self.given.reviewer_exists()
            archivist = await self.given.archivist_exists()

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer, role=ListRole.main_reviewer),
                await self.given.assignee_exists(user=archivist, role=ListRole.archivist),
            ]

            zaken = await self.given.zaken_are_indexed(amount=3, recreate=True)
            await self.given.list_exists(
                assignee=reviewer,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to sort",
                status=ListStatus.ready_to_review,
                zaken=zaken
            )

            await self.when.reviewer_logs_in(page)
            await self.when.user_clicks_button(page, "Destruction list to sort")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review")

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review?ordering=identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/review?ordering=-identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-2", "ZAAK-1", "ZAAK-0"])

    async def test_scenario_sort_destruction_list_process_review_page(self):
        @sync_to_async
        def create_data():
            record_manager = UserFactory.create(
                password="ANic3Password", post__can_start_destruction=True
            )
            destruction_list = DestructionListFactory.create(
                assignee=record_manager,
                author=record_manager,
                uuid="00000000-0000-0000-0000-000000000000",
                status=ListStatus.changes_requested
            )
            zaak1 = ZaakFactory.create(
                identificatie="ZAAK-0",
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
            item1 = DestructionListItemFactory.create(zaak=zaak1, destruction_list=destruction_list)

            zaak2 = ZaakFactory.create(
                identificatie="ZAAK-1",
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
            item2 = DestructionListItemFactory.create(zaak=zaak2, destruction_list=destruction_list)

            zaak3 = ZaakFactory.create(
                identificatie="ZAAK-2",
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
            item3 = DestructionListItemFactory.create(zaak=zaak3, destruction_list=destruction_list)

            review = DestructionListReviewFactory.create(
                destruction_list=destruction_list,
                decision=ReviewDecisionChoices.rejected,
            )
            DestructionListItemReviewFactory.create(
                destruction_list=destruction_list,
                destruction_list_item=item1,
                review=review
            )
            DestructionListItemReviewFactory.create(
                destruction_list=destruction_list,
                destruction_list_item=item2,
                review=review
            )
            DestructionListItemReviewFactory.create(
                destruction_list=destruction_list,
                destruction_list_item=item3,
                review=review
            )

            self.destruction_list = destruction_list

        async with browser_page() as page:
            await self.given.data_exists(create_data)
            await self.when.user_logs_in(page, self.destruction_list.assignee)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, self.destruction_list.name)
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/process-review")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/process-review?ordering=identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-0", "ZAAK-1", "ZAAK-2"])

            await self.when.user_clicks_button(page, "Identificatie")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/process-review?ordering=-identificatie")
            await self.then.zaken_should_have_order(page, ["ZAAK-2", "ZAAK-1", "ZAAK-0"])

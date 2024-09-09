# fmt: off
from django.test import tag

from asgiref.sync import sync_to_async

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.constants import (
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
)
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ...factories import (
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
)


@tag("e2e")
class FeatureProcessReviewTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_process_review(self):
        async with browser_page() as page:
            await self.given.selectielijstklasse_choices_are_available(page)
            record_manager = await self.given.record_manager_exists()
            reviewer1 = await self.given.reviewer_exists(username="Beoordelaar 1")
            reviewer2 = await self.given.reviewer_exists(username="Beoordelaar 2")

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer1, role=ListRole.reviewer),
                await self.given.assignee_exists(user=reviewer2, role=ListRole.reviewer),
            ]

            destruction_list = await self.given.list_exists(
                assignee=record_manager,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to process",
                status=ListStatus.changes_requested,
            )

            # Both reviewers provided a review.
            await self.given.review_exists(author=reviewer1, destruction_list=destruction_list, decision=ReviewDecisionChoices.accepted)
            await self.given.review_exists(author=reviewer2, destruction_list=destruction_list, decision=ReviewDecisionChoices.rejected)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to process")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000")

            # TODO
            await self.when.user_clicks_checkbox(page, "(de)selecteer rij")

            # Fill selectielijstklasse as it's probably missing.
            await self.when.user_clicks_radio(page, "Aanpassen van selectielijstklasse")
            await self.when.user_fills_form_field(page, "Selectielijstklasse", "11.1 - Verleend - vernietigen - P1Y")

            # Fill archive date
            await self.when.user_clicks_radio(page, "Verlengen bewaartermijn")
            await self.when.user_fills_form_field(page, "Archief datum", "09/15/2023")
            await page.keyboard.press("Enter")

            await self.when.user_fills_form_field(page, "Reden", "Andere datum")
            await self.when.user_clicks_button(page, "muteren")
            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(page, "Opmerking", "Datum aangepast")
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")

    async def test_zaaktype_filters_on_process_review_page(self):
        @sync_to_async
        def create_data():
            record_manager = UserFactory.create(
                password="ANic3Password", role__can_start_destruction=True
            )
            destruction_list = DestructionListFactory.create(
                assignee=record_manager,
                author=record_manager,
                uuid="00000000-0000-0000-0000-000000000000",
                status=ListStatus.changes_requested
            )
            zaak1 = ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-01",
                        "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                    }
                },
                url="http://catalogue-api.nl/zaaktypen/111-111-111",
            )
            item1 = DestructionListItemFactory.create(zaak=zaak1, destruction_list=destruction_list)
            zaak2 = ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-02",
                        "url": "http://catalogue-api.nl/zaaktypen/222-222-222",
                    }
                },
                url="http://catalogue-api.nl/zaaktypen/222-222-222",
            )
            DestructionListItemFactory.create(zaak=zaak2, destruction_list=destruction_list)

            ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-03",
                        "url": "http://catalogue-api.nl/zaaktypen/333-333-333",
                    }
                },
                url="http://catalogue-api.nl/zaaktypen/333-333-333",
            )
            zaak5 = ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-05",
                        "url": "http://catalogue-api.nl/zaaktypen/555-555-555",
                    }
                },
                url="http://catalogue-api.nl/zaaktypen/555-555-555",
            )
            DestructionListItemFactory.create(zaak=zaak5)  # Different destruction list

            # Negative review item only for zaak 1
            review = DestructionListReviewFactory.create(
                destruction_list=destruction_list,
                decision=ReviewDecisionChoices.rejected,
            )
            DestructionListItemReviewFactory.create(
                destruction_list=destruction_list,
                destruction_list_item=item1, 
                review=review
            )

            self.destruction_list = destruction_list

        async with browser_page() as page:
            await self.given.data_exists(create_data)
            await self.when.user_logs_in(page, self.destruction_list.assignee)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, self.destruction_list.name)
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000")
            
            await self.then.zaaktype_filters_are(page, ["ZAAKTYPE-01"])

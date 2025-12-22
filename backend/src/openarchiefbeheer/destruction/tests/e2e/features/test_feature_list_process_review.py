# fmt: off
from unittest.mock import patch

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
from openarchiefbeheer.utils.utils_decorators import AsyncCapableRequestsMock
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ...factories import (
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
)


@tag("e2e")
@AsyncCapableRequestsMock()
class FeatureProcessReviewTests(GherkinLikeTestCase):
    async def test_scenario_record_manager_process_review(self, requests_mock: AsyncCapableRequestsMock):
        patcher = patch(
            "openarchiefbeheer.destruction.api.serializers.retrieve_selectielijstklasse_resultaat",
            return_value={"waardering": "vernietigen"}
        )
        patcher.start()
        self.addCleanup(patcher.stop)

        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            await self.given.selectielijstklasse_choices_are_available(page)
            record_manager = await self.given.record_manager_exists()
            reviewer = await self.given.reviewer_exists(username="Beoordelaar")

            assignees = [
                await self.given.assignee_exists(user=record_manager, role=ListRole.author),
                await self.given.assignee_exists(user=reviewer, role=ListRole.main_reviewer),
            ]

            destruction_list = await self.given.list_exists(
                assignee=record_manager,
                assignees=assignees,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to process",
                status=ListStatus.changes_requested,
            )

            # Reviewer provided a review.
            await self.given.review_exists(author=reviewer, destruction_list=destruction_list, decision=ReviewDecisionChoices.rejected)

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to process")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/process-review")

            await self.when.user_clicks_button(page, "Muteren")

            # Fill selectielijstklasse as it's probably missing.
            await self.when.user_clicks_radio(page, "Aanpassen van selectielijstklasse")
            await self.when.user_fills_form_field(page, "Selectielijstklasse", "1.1 - Ingericht - vernietigen - P10Y")

            # Fill archive date
            await self.when.user_clicks_radio(page, "Verlengen bewaartermijn")
            await self.when.user_fills_form_field(page, "Dag van de maand", "09/15/2023")
            await page.keyboard.press("Enter")

            await self.when.user_fills_form_field(page, "Reden", "Andere datum")
            await self.when.user_clicks_button(page, "muteren")
            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(page, "Opmerking", "Datum aangepast")
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")

    async def test_zaaktype_filters_on_process_review_page(self, requests_mock):
        @sync_to_async
        def create_data():
            record_manager = UserFactory.create(
                password="ANic3Password", post__can_start_destruction=True
            )
            destruction_list = DestructionListFactory.create(
                assignee=record_manager,
                author=record_manager,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to process review for",
                status=ListStatus.changes_requested
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
            item1 = DestructionListItemFactory.create(zaak=zaak1, destruction_list=destruction_list)
            zaak2 = ZaakFactory.create(
                identificatie="ZAAK-111-1",
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
            DestructionListItemFactory.create(zaak=zaak3, destruction_list=destruction_list)

            ZaakFactory.create(
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
            zaak5 = ZaakFactory.create(
                post___expand={
                    "zaaktype": {
                        "identificatie": "ZAAKTYPE-05",
                        "omschrijving": "ZAAKTYPE-05",
                        "url": "http://catalogue-api.nl/zaaktypen/555-555-555",
                        "selectielijst_procestype": {
                            "url": "http://selectielijst.nl/api/v1/procestype/1"
                        },
                        "versiedatum": "2024-01-01"
                    }
                },
            )
            DestructionListItemFactory.create(zaak=zaak5)  # Different destruction list

            # Negative review item for zaak 1 and 2
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

            self.destruction_list = destruction_list

        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            await self.given.data_exists(create_data)
            await self.when.user_logs_in(page, self.destruction_list.assignee)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to process review for")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/process-review")

            await self.then.zaaktype_filters_are(page, ["ZAAKTYPE-01 (ZAAKTYPE-01)", "ZAAKTYPE-02 (ZAAKTYPE-02)"])

            # If filtering first on identificatie, the zaaktype filters change
            await self.when.user_filters_zaken(page, "identificatie", "ZAAK-000")
            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/process-review?identificatie__icontains=ZAAK-000&page=1")
            await self.then.this_number_of_zaken_should_be_visible(page, 1)
            await self.then.zaaktype_filters_are(page, ["ZAAKTYPE-01 (ZAAKTYPE-01)"])

    @tag("gh-378")
    async def test_zaak_removed_outside_process(self, requests_mock: AsyncCapableRequestsMock):
        @sync_to_async
        def create_data():
            record_manager = UserFactory.create(username="Record Manager", password="ANic3Password", post__can_start_destruction=True)

            zaken = ZaakFactory.create_batch(2)
            destruction_list = DestructionListFactory.create(
                author=record_manager,
                assignee=record_manager,
                status=ListStatus.changes_requested,
                uuid="00000000-0000-0000-0000-000000000000",
                name="Destruction list to process",
            )
            item1 = DestructionListItemFactory.create(destruction_list=destruction_list, zaak=zaken[0])
            item2 = DestructionListItemFactory.create(destruction_list=destruction_list, zaak=zaken[1])

            review = DestructionListReviewFactory.create(destruction_list=destruction_list, decision=ReviewDecisionChoices.rejected)
            DestructionListItemReviewFactory.create(destruction_list=destruction_list, destruction_list_item=item1, review=review)
            DestructionListItemReviewFactory.create(destruction_list=destruction_list, destruction_list_item=item2, review=review)

            # Simulate the zaak being deleted by *something else*
            item1.zaak.delete()

        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            await self.given.data_exists(create_data)
            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to process")

            await self.then.path_should_be(page, "/destruction-lists/00000000-0000-0000-0000-000000000000/process-review")
            await self.then.page_should_contain_text(page, "Opnieuw indienen")
            await self.then.this_number_of_zaken_should_be_visible(page, 1)

from django.test import tag

from asgiref.sync import sync_to_async

from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.utils.utils_decorators import AsyncCapableRequestsMock
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ....constants import (
    DestructionListItemAction,
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
    ZaakActionType,
)

SELECTIELIJSTKLASSE_WITH_BEWAARTERMIJN = (
    "https://selectielijst.openzaak.nl/api/v1/resultaten/"
    "afa30940-855b-4a7e-aa21-9e15a8078814"
)
SELECTIELIJSTKLASSE_WITHOUT_BEWAARTERMIJN = (
    "https://selectielijst.openzaak.nl/api/v1/resultaten/"
    "8af64c99-a168-40dd-8afd-9fbe0597b6dc"
)
CURRENT_SELECTIELIJSTKLASSE = (
    "https://selectielijst.openzaak.nl/api/v1/resultaten/"
    "e84a06ac-1bdc-4e9c-9598-a22faa562459"
)
RESULTAATTYPE = "http://catalogi-api.nl/resultaattypen/111-111-111"


@tag("e2e")
@tag("issue")
@tag("gh-1118")
@AsyncCapableRequestsMock()
class Issue1118ZaakMuteren(GherkinLikeTestCase):
    """
    Here we test scenarios when the record manager changes selectielijstklasse
    or/and archiefactiedatum of the zaak in the "Muteren" modal
    """

    async def setup_process_review(self, page, requests_mock):
        await self.given.services_are_configured(requests_mock)
        await self.given.selectielijstklasse_choices_are_available(page)
        self.given.selectielijst_backend_services_are_available()

        record_manager = await self.given.record_manager_exists()
        reviewer = await self.given.reviewer_exists(username="Beoordelaar")

        zaak = await sync_to_async(ZaakFactory.create)(
            identificatie="ZAAK-1118",
            selectielijstklasse=CURRENT_SELECTIELIJSTKLASSE,
            archiefactiedatum="2024-01-01",
            archiefnominatie="vernietigen",
        )

        assignees = [
            await self.given.assignee_exists(user=record_manager, role=ListRole.author),
            await self.given.assignee_exists(
                user=reviewer, role=ListRole.main_reviewer
            ),
        ]

        destruction_list = await self.given.list_exists(
            assignee=record_manager,
            assignees=assignees,
            zaken=[zaak],
            uuid="00000000-0000-0000-0000-000000000000",
            name="List 1118",
            status=ListStatus.changes_requested,
        )

        await self.given.review_exists(
            author=reviewer,
            destruction_list=destruction_list,
            decision=ReviewDecisionChoices.rejected,
        )

        await self.when.record_manager_logs_in(page)
        await self.when.user_clicks_button(page, "List 1118")

        await self.then.path_should_be(
            page,
            "/destruction-lists/00000000-0000-0000-0000-000000000000/process-review",
        )

    async def test_change_selectielijstklasse_does_not_set_archive_date_implicitly(
        self,
        requests_mock: AsyncCapableRequestsMock,
    ):
        """
        Changing only the selectielijstklasse must not implicitly submit an
        archiefactiedatum.

        Action: "Selectielijstklasse aanpassen".
        The archive date should only be submitted when the user explicitly
        changes it.
        """
        async with browser_page() as page:
            await self.setup_process_review(page, requests_mock)

            await self.when.user_clicks_button(page, "Muteren")
            await self.when.user_clicks_radio(page, "Selectielijstklasse aanpassen")

            await self.when.user_fills_form_field(
                page, "Selectielijstklasse", "1.1 - Ingericht - vernietigen - P10Y"
            )
            await self.when.user_fills_form_field(
                page, "Resultaattype", "Resultaattype 1"
            )
            await self.when.user_fills_form_field(
                page, "Reden", "Andere selectielijstklasse"
            )
            await self.when.user_clicks_button(page, "ZAAK-1118 muteren")

            await self.then.page_should_contain_text(page, "Uitgezonderd")

            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(
                page, "Opmerking", "Selectielijstklasse aangepast"
            )
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.then.review_response_should_have_values(
                action_item=DestructionListItemAction.remove,
                action_zaak_type=ZaakActionType.selectielijstklasse_and_bewaartermijn,
                action_zaak={
                    "selectielijstklasse": SELECTIELIJSTKLASSE_WITH_BEWAARTERMIJN,
                    "resultaattype": RESULTAATTYPE,
                },
            )

    async def test_change_selectielijstklasse_without_bewaartermijn(
        self,
        requests_mock: AsyncCapableRequestsMock,
    ):
        """
        A selectielijstklasse without bewaartermijn should not show an
        archiefactiedatum.

        Action: "Selectielijstklasse aanpassen".
        """
        async with browser_page() as page:
            await self.setup_process_review(page, requests_mock)

            await self.when.user_clicks_button(page, "Muteren")
            await self.when.user_clicks_radio(page, "Selectielijstklasse aanpassen")

            await self.when.user_fills_form_field(
                page, "Selectielijstklasse", "1.1.1 - Ingericht - blijvend_bewaren"
            )
            await self.then.form_field_should_not_be_visible(page, "Archiefactiedatum")
            await self.when.user_fills_form_field(
                page, "Reden", "Andere selectielijstklasse"
            )

            await self.when.user_clicks_button(page, "ZAAK-1118 muteren")
            await self.then.page_should_contain_text(page, "Uitgezonderd")

            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(
                page, "Opmerking", "Selectielijstklasse aangepast"
            )
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.review_response_should_have_values(
                action_item=DestructionListItemAction.remove,
                action_zaak_type=ZaakActionType.selectielijstklasse_and_bewaartermijn,
                action_zaak={
                    "selectielijstklasse": SELECTIELIJSTKLASSE_WITHOUT_BEWAARTERMIJN,
                    "resultaattype": "",
                },
            )

    async def test_change_archiefactiedatum_is_explicit_action(
        self,
        requests_mock: AsyncCapableRequestsMock,
    ):
        """
        Explicitly selecting 'Archiefactiedatum aanpassen' should store the
        date using the change_archiefactiedatum action.
        """
        async with browser_page() as page:
            await self.setup_process_review(page, requests_mock)

            await self.when.user_clicks_button(page, "Muteren")
            await self.when.user_clicks_radio(page, "Archiefactiedatum aanpassen")

            await self.when.user_fills_date_field(
                page, "Archiefactiedatum", "2030-09-15"
            )
            await self.when.user_fills_form_field(
                page, "Reden", "Archiefactiedatum aangepast"
            )

            await self.when.user_clicks_button(page, "muteren")
            await self.then.page_should_contain_text(page, "Uitgezonderd")

            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(
                page, "Opmerking", "Archiefactiedatum aangepast"
            )
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.review_response_should_have_values(
                action_item=DestructionListItemAction.remove,
                action_zaak_type=ZaakActionType.bewaartermijn,
                action_zaak={"archiefactiedatum": "2030-09-15"},
            )

    async def test_change_selectielijstklasse_and_archiefactiedatum(
        self,
        requests_mock: AsyncCapableRequestsMock,
    ):
        """
        Change both 'selectielijstklasse' and 'archiefactiedatum'
        """
        async with browser_page() as page:
            await self.setup_process_review(page, requests_mock)

            await self.when.user_clicks_button(page, "Muteren")
            await self.when.user_clicks_radio(page, "Selectielijstklasse aanpassen")

            await self.when.user_fills_form_field(
                page,
                "Selectielijstklasse",
                "1.1 - Ingericht - vernietigen - P10Y",
            )
            await self.when.user_fills_form_field(
                page, "Resultaattype", "Resultaattype 1"
            )
            await self.when.user_fills_date_field(
                page, "Archiefactiedatum", "2030-09-15"
            )
            await self.when.user_fills_form_field(
                page, "Reden", "Andere selectielijstklasse en archiefactiedatum"
            )
            await self.when.user_clicks_button(page, "ZAAK-1118 muteren")

            await self.then.page_should_contain_text(page, "Uitgezonderd")

            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(
                page, "Opmerking", "Selectielijstklasse en archiefactiedatum aangepast"
            )
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.then.review_response_should_have_values(
                action_item=DestructionListItemAction.remove,
                action_zaak_type=ZaakActionType.selectielijstklasse_and_bewaartermijn,
                action_zaak={
                    "selectielijstklasse": SELECTIELIJSTKLASSE_WITH_BEWAARTERMIJN,
                    "resultaattype": RESULTAATTYPE,
                    "archiefactiedatum": "2030-09-15",
                },
            )

    async def test_reject_proposal_does_not_submit_zaak_mutation(
        self,
        requests_mock: AsyncCapableRequestsMock,
    ):
        """
        Rejecting the reviewer's proposal should store the keep action without
        proposing a mutation to the zaak.
        """
        async with browser_page() as page:
            await self.setup_process_review(page, requests_mock)

            await self.when.user_clicks_button(page, "Muteren")
            await self.when.user_clicks_radio(page, "Voorstel afwijzen")
            await self.when.user_fills_form_field(
                page, "Reden", "Ik wil de zaak ongewijzigd behouden"
            )

            await self.when.user_clicks_button(page, "ZAAK-1118 muteren")

            await self.then.page_should_contain_text(page, "Voorstel afgewezen")

            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(page, "Opmerking", "Ongewijzigd")
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.then.review_response_should_have_values(
                action_item=DestructionListItemAction.keep,
                action_zaak_type="",
                action_zaak=None,
            )

from django.test import TestCase

from requests.exceptions import ConnectTimeout
from requests_mock import Mocker
from rest_framework import status
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.utils.results_store import ResultStore
from openarchiefbeheer.zaken.utils import delete_zaak_and_related_objects, format_zaaktype_choices

class DeletingZakenWithErrorsTests(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )
        cls.drc_service = ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
        )
        cls.brc_service = ServiceFactory.create(
            api_type=APITypes.brc,
            api_root="http://localhost:8003/besluiten/api/v1",
        )

    @Mocker()
    def test_failure_on_deleting_besluit_relation_is_handled(self, m):
        destruction_list_item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        result_store = ResultStore(store=destruction_list_item)

        m.get(
            "http://localhost:8003/besluiten/api/v1/besluiten",
            json={
                "count": 1,
                "results": [
                    {
                        "url": "http://localhost:8003/besluiten/api/v1/besluiten/111-111-111"
                    }
                ],
            },
        )
        m.get(
            "http://localhost:8003/besluiten/api/v1/besluitinformatieobjecten?besluit=http://localhost:8003/besluiten/api/v1/besluiten/111-111-111",
            json=[
                {
                    "url": "http://localhost:8003/besluiten/api/v1/besluitinformatieobjecten/111-111-111",
                    "informatieobject": "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
                }
            ],
        )
        m.delete(
            "http://localhost:8003/besluiten/api/v1/besluitinformatieobjecten/111-111-111",
            status_code=status.HTTP_204_NO_CONTENT,
        )
        m.delete(
            "http://localhost:8003/besluiten/api/v1/besluiten/111-111-111",
            exc=ConnectTimeout,
        )

        try:
            delete_zaak_and_related_objects(destruction_list_item.zaak, result_store)
        except ConnectTimeout:
            # We configured the mock to raise this error
            pass

        result_store.refresh_from_db()
        results = result_store.get_internal_results()

        self.assertEqual(
            results["deleted_resources"]["besluitinformatieobjecten"][0],
            "http://localhost:8003/besluiten/api/v1/besluitinformatieobjecten/111-111-111",
        )
        self.assertEqual(
            results["resources_to_delete"]["enkelvoudiginformatieobjecten"][0],
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
        )

    @Mocker()
    def test_failure_on_deleting_zaak_relation_is_handled(self, m):
        destruction_list_item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        result_store = ResultStore(store=destruction_list_item)

        m.get(
            "http://localhost:8003/besluiten/api/v1/besluiten",
            json={
                "count": 0,
                "results": [],
            },
        )
        m.get(
            f"http://localhost:8003/zaken/api/v1/zaakinformatieobjecten?zaak={destruction_list_item.zaak.url}",
            json=[
                {
                    "url": "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten/111-111-111",
                    "informatieobject": "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
                }
            ],
        )
        m.delete(
            "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten/111-111-111",
            status_code=status.HTTP_204_NO_CONTENT,
        )
        m.delete(
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
            exc=ConnectTimeout,
        )

        try:
            delete_zaak_and_related_objects(destruction_list_item.zaak, result_store)
        except ConnectTimeout:
            # We configured the mock to raise this error
            pass

        result_store.refresh_from_db()
        results = result_store.get_internal_results()

        self.assertEqual(
            results["deleted_resources"]["zaakinformatieobjecten"][0],
            "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten/111-111-111",
        )
        self.assertEqual(
            results["resources_to_delete"]["enkelvoudiginformatieobjecten"][0],
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
        )

        # The ZIO has already been deleted, so it is not returned anymore by OpenZaak
        m.get(
            f"http://localhost:8003/zaken/api/v1/zaakinformatieobjecten?zaak={destruction_list_item.zaak.url}",
            json=[],
        )

        with self.assertRaises(ConnectTimeout):
            delete_zaak_and_related_objects(destruction_list_item.zaak, result_store)

class FormatZaaktypeChoicesTests(TestCase):
    def test_format_zaaktype_choices_with_multiple_versions(self):
        # Test that the function picks the latest version of each zaaktype based on versiedatum
        zaaktypen = [
            {
                "identificatie": "ZKT-001",
                "url": "http://localhost:8000/api/v1/zaaktypen/1",
                "omschrijving": "Zaaktype 1",
                "versiedatum": "2023-01-01",
            },
            {
                "identificatie": "ZKT-001",
                "url": "http://localhost:8000/api/v1/zaaktypen/2",
                "omschrijving": "Zaaktype 1 Updated",
                "versiedatum": "2023-06-01",
            },
            {
                "identificatie": "ZKT-002",
                "url": "http://localhost:8000/api/v1/zaaktypen/3",
                "omschrijving": "Zaaktype 2",
                "versiedatum": "2022-12-01",
            },
        ]

        # Expecting the most recent version for each zaaktype, with URLs aggregated
        expected_result = [
            {
                "label": "Zaaktype 1 Updated (ZKT-001)",
                "value": "http://localhost:8000/api/v1/zaaktypen/1,http://localhost:8000/api/v1/zaaktypen/2",
            },
            {
                "label": "Zaaktype 2 (ZKT-002)",
                "value": "http://localhost:8000/api/v1/zaaktypen/3",
            },
        ]

        result = format_zaaktype_choices(zaaktypen)
        self.assertEqual(result, expected_result)

    def test_format_zaaktype_choices_with_no_identificatie(self):
        # Test how the function handles zaaktypen with no identificatie
        zaaktypen = [
            {
                "identificatie": None,
                "url": "http://localhost:8000/api/v1/zaaktypen/1",
                "omschrijving": "Zaaktype without ID",
                "versiedatum": "2023-01-01",
            }
        ]

        # Should fall back to using "no identificatie" in the label
        expected_result = [
            {
                "label": "Zaaktype without ID (no identificatie)",
                "value": "http://localhost:8000/api/v1/zaaktypen/1",
            }
        ]

        result = format_zaaktype_choices(zaaktypen)
        self.assertEqual(result, expected_result)

    def test_format_zaaktype_choices_with_empty_input(self):
        # Test the behavior with an empty input list
        zaaktypen = []
        expected_result = []

        # Should return an empty list
        result = format_zaaktype_choices(zaaktypen)
        self.assertEqual(result, expected_result)

    def test_format_zaaktype_choices_sorted_output(self):
        # Test that the output is sorted by label
        zaaktypen = [
            {
                "identificatie": "ZKT-002",
                "url": "http://localhost:8000/api/v1/zaaktypen/2",
                "omschrijving": "Zaaktype B",
                "versiedatum": "2023-01-01",
            },
            {
                "identificatie": "ZKT-001",
                "url": "http://localhost:8000/api/v1/zaaktypen/1",
                "omschrijving": "Zaaktype A",
                "versiedatum": "2023-01-01",
            },
        ]

        # Expecting the results to be sorted alphabetically by label
        expected_result = [
            {
                "label": "Zaaktype A (ZKT-001)",
                "value": "http://localhost:8000/api/v1/zaaktypen/1",
            },
            {
                "label": "Zaaktype B (ZKT-002)",
                "value": "http://localhost:8000/api/v1/zaaktypen/2",
            },
        ]

        result = format_zaaktype_choices(zaaktypen)
        self.assertEqual(result, expected_result)

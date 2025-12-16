import contextlib

from django.test import TestCase

from requests.exceptions import ConnectTimeout
from requests_mock import Mocker
from rest_framework import status
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes, AuthTypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.clients import zrc_client
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.external_registers.contrib.openklant.constants import (
    OPENKLANT_IDENTIFIER,
)
from openarchiefbeheer.external_registers.models import ExternalRegisterConfig
from openarchiefbeheer.utils.results_store import ResultStore
from openarchiefbeheer.utils.tests.resources_client import OpenZaakDataCreationHelper
from openarchiefbeheer.zaken.utils import (
    delete_external_relations,
    delete_zaak_and_related_objects,
    format_zaaktype_choices,
)


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
            "http://localhost:8003/zaken/api/v1/zaakobjecten?zaak=http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            json={
                "count": 0,
                "results": [],
            },
        )
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

        with contextlib.suppress(ConnectTimeout):
            # We configured the mock to raise this error
            delete_zaak_and_related_objects(
                destruction_list_item.zaak,
                excluded_relations=[],
                result_store=result_store,
            )

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
            "http://localhost:8003/zaken/api/v1/zaakobjecten?zaak=http://localhost:8003/zaken/api/v1/zaken/111-111-111",
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

        # We configured the mock to raise this error
        with contextlib.suppress(ConnectTimeout):
            delete_zaak_and_related_objects(
                destruction_list_item.zaak,
                excluded_relations=[],
                result_store=result_store,
            )

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
            delete_zaak_and_related_objects(
                destruction_list_item.zaak,
                excluded_relations=[],
                result_store=result_store,
            )


class FormatZaaktypeChoicesTests(TestCase):
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
                "value": "",
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


class DeleteExternalRelationsTests(VCRMixin, TestCase):
    @Mocker(real_http=True)
    def test_delete_external_relations(self, m):
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        result_store = ResultStore(store=item)
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )
        ok_service = ServiceFactory.create(
            slug="openklant",
            api_type=APITypes.orc,
            api_root="http://localhost:8005/klantinteracties/api/v1/",
            auth_type=AuthTypes.api_key,
            header_key="Authorization",
            header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
        )
        config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
        config.enabled = True
        config.services.add(ok_service)
        config.save()
        helper = OpenZaakDataCreationHelper(openklant_service_slug="openklant")
        klantcontact = helper.create_klantcontact()
        assert isinstance(klantcontact["url"], str)

        # TODO: Replace with real interactions once it is possible to do this in Open Zaak
        m.get(
            "http://localhost:8003/zaken/api/v1/zaakobjecten"
            "?zaak=http%3A%2F%2Flocalhost%3A8003%2Fzaken%2Fapi%2Fv1%2Fzaken%2F111-111-111",
            json={
                "count": 1,
                "results": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/zaakobjecten/111-111-111",
                        "object": klantcontact["url"],
                    }
                ],
            },
        )

        delete_external_relations(
            zaak_url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            zrc_client=zrc_client(),
            excluded_relations=[],
            result_store=result_store,
        )

        results = result_store.get_internal_results()
        self.assertEqual(
            results["deleted_resources"]["klantcontacten"][0],
            klantcontact["url"],
        )

    @Mocker(real_http=True)
    def test_delete_external_relations_except_excluded(self, m):
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            excluded_relations=[
                "http://localhost:8003/zaken/api/v1/zaakobjecten/111-111-111"
            ],
        )
        result_store = ResultStore(store=item)
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )
        ok_service = ServiceFactory.create(
            slug="openklant",
            api_type=APITypes.orc,
            api_root="http://localhost:8005/klantinteracties/api/v1/",
            auth_type=AuthTypes.api_key,
            header_key="Authorization",
            header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
        )
        config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
        config.enabled = True
        config.services.add(ok_service)
        config.save()
        helper = OpenZaakDataCreationHelper(openklant_service_slug="openklant")
        klantcontact1 = helper.create_klantcontact()
        klantcontact2 = helper.create_klantcontact()
        assert isinstance(klantcontact1["url"], str) and isinstance(
            klantcontact2["url"], str
        )

        # TODO: Replace with real interactions once it is possible to do this in Open Zaak
        m.get(
            "http://localhost:8003/zaken/api/v1/zaakobjecten"
            "?zaak=http%3A%2F%2Flocalhost%3A8003%2Fzaken%2Fapi%2Fv1%2Fzaken%2F111-111-111",
            json={
                "count": 1,
                "results": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/zaakobjecten/111-111-111",
                        "object": klantcontact1["url"],
                    },
                    {
                        "url": "http://localhost:8003/zaken/api/v1/zaakobjecten/222-222-222",
                        "object": klantcontact2["url"],
                    },
                ],
            },
        )

        delete_external_relations(
            zaak_url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            zrc_client=zrc_client(),
            excluded_relations=item.excluded_relations,
            result_store=result_store,
        )

        results = result_store.get_internal_results()
        self.assertEqual(len(results["deleted_resources"]["klantcontacten"]), 1)
        self.assertEqual(
            results["deleted_resources"]["klantcontacten"][0],
            klantcontact2["url"],
        )

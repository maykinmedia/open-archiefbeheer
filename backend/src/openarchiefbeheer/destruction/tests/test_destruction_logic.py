import contextlib

from django.test import TestCase

from requests.exceptions import ConnectTimeout
from requests_mock import Mocker
from rest_framework import status
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.destruction.constants import ResourceDestructionResultStatus
from openarchiefbeheer.destruction.destruction_logic import (
    delete_besluiten_and_besluiteninformatieobjecten,
    delete_enkelvoudiginformatieobjecten,
)
from openarchiefbeheer.destruction.models import ResourceDestructionResult
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory


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
            delete_besluiten_and_besluiteninformatieobjecten(destruction_list_item)

        result = ResourceDestructionResult.objects.get(
            item=destruction_list_item,
            resource_type="enkelvoudiginformatieobjecten",
            status=ResourceDestructionResultStatus.to_be_deleted,
        )

        self.assertEqual(
            result.url,
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
        )

    @Mocker()
    def test_failure_on_deleting_document(self, m):
        destruction_list_item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )

        m.delete(
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
            exc=ConnectTimeout,
        )

        result = ResourceDestructionResult.objects.create(
            item=destruction_list_item,
            resource_type="enkelvoudiginformatieobjecten",
            status=ResourceDestructionResultStatus.to_be_deleted,
            url="http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
        )

        with self.assertRaises(ConnectTimeout):
            delete_enkelvoudiginformatieobjecten(destruction_list_item)

        result.refresh_from_db()
        self.assertEqual(result.status, ResourceDestructionResultStatus.to_be_deleted)

from unittest.mock import patch

from django.test import TestCase, tag

from privates.test import temp_private_root
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.utils.results_store import ResultStore

from ...constants import InternalStatus, ListStatus
from ..factories import DestructionListFactory


@tag("vcr")
@temp_private_root()
class CreateDestructionReportTest(VCRMixin, TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.drc_service = ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.ztc_service = ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

    def test_create_destruction_report(self):
        destruction_list = DestructionListFactory.create(
            processing_status=InternalStatus.new,
            status=ListStatus.deleted,
            with_report=True,
        )

        with patch(
            "openarchiefbeheer.destruction.utils.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(
                bronorganisatie="000000000",
                zaaktype="ZAAKTYPE-2018-0000000002",
                statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
                resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
                informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
            ),
        ):
            destruction_list.create_report_zaak()

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.zaak_destruction_report_url,
            "http://localhost:8003/zaken/api/v1/zaken/b57802b1-69be-422f-b73a-62e171580fa8",
        )

        store = ResultStore(destruction_list)

        self.assertEqual(
            store.get_created_resources("resultaten"),
            [
                "http://localhost:8003/zaken/api/v1/resultaten/756d8a14-18c8-4e89-9e54-63da7007ae67"
            ],
        )
        self.assertEqual(
            store.get_created_resources("statussen"),
            [
                "http://localhost:8003/zaken/api/v1/statussen/24ba0810-c24f-4291-bb63-4c9eb16aab8e"
            ],
        )
        self.assertEqual(
            store.get_created_resources("enkelvoudiginformatieobjecten"),
            [
                "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/758ebbe8-2378-4c5f-99af-b60372c0a01f"
            ],
        )
        self.assertEqual(
            store.get_created_resources("zaakinformatieobjecten"),
            [
                "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten/927c7776-953a-4409-b8ff-f8c0f72fe08f"
            ],
        )

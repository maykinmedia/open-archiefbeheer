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
                zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ecd08880-5081-4d7a-afc3-ade1d6e6346f",
                statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
                resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
                informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
                selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/e939c1ad-32e4-409b-a716-6d7d6e7df892",
            ),
        ):
            destruction_list.create_report_zaak()

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.zaak_destruction_report_url,
            "http://localhost:8003/zaken/api/v1/zaken/d2762871-fd55-4c72-9748-e8e2d745c6a6",
        )

        store = ResultStore(destruction_list)

        self.assertEqual(
            store.get_created_resources("resultaten"),
            [
                "http://localhost:8003/zaken/api/v1/resultaten/750619bf-4eeb-4d81-8d5f-ceda31547645"
            ],
        )
        self.assertEqual(
            store.get_created_resources("statussen"),
            [
                "http://localhost:8003/zaken/api/v1/statussen/633da83a-3e82-48e4-8080-efeff2491d2d"
            ],
        )
        self.assertEqual(
            store.get_created_resources("enkelvoudiginformatieobjecten"),
            [
                "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/174fc1c3-36fe-4ed1-b2c4-b0368efa2008"
            ],
        )
        self.assertEqual(
            store.get_created_resources("zaakinformatieobjecten"),
            [
                "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten/c7cd732c-8e62-49c2-88ea-e9c888e7a9e7"
            ],
        )

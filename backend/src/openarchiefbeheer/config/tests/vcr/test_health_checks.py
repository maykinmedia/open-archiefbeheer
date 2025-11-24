from django.test import TestCase

from maykin_health_checks.runner import HealthChecksRunner
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.health_checks import checks_collector
from openarchiefbeheer.config.tests.factories import (
    APIConfigFactory,
    ArchiveConfigFactory,
)


class TestConfigurationHealthChecks(VCRMixin, TestCase):
    def test_services_badly_configured(self):
        service_zrc = ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8002/zaken/api/v1",  # Wrong port
        )
        service_drc = ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8002/documenten/api/v1",  # Wrong port
        )
        service_brc = ServiceFactory.create(
            api_type=APITypes.brc,
            api_root="http://localhost:8002/besluiten/api/v1",  # Wrong port
        )
        service_ztc = ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8002/catalogi/api/v1",  # Wrong port
        )
        service = ServiceFactory(
            slug="selectielijst",
            api_type=APITypes.orc,
            api_root="https://selectielijst.non-existent.nl/api/v1/",
        )
        APIConfigFactory.create(selectielijst_api_service=service)
        ArchiveConfigFactory.create(
            bronorganisatie="000000000",
            zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ecd08880-5081-4d7a-afc3-ade1d6e6346f",
            statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
            resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
            informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
        )

        runner = HealthChecksRunner(checks_collector=checks_collector)
        failed_checks = runner.run_checks()

        self.assertEqual(len(failed_checks), 1)
        self.assertEqual(failed_checks[0].identifier, "services_configuration")
        self.assertEqual(len(failed_checks[0].extra), 5)
        self.assertEqual(
            sorted([extra_info.message for extra_info in failed_checks[0].extra]),
            sorted(
                [
                    service_zrc.label,
                    service_brc.label,
                    service_drc.label,
                    service_ztc.label,
                    service.label,
                ]
            ),
        )

    def test_correctly_configured(self):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        ServiceFactory.create(
            api_type=APITypes.brc,
            api_root="http://localhost:8003/besluiten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        service = ServiceFactory(
            slug="selectielijst",
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1/",
        )
        APIConfigFactory.create(selectielijst_api_service=service)
        ArchiveConfigFactory.create(
            bronorganisatie="000000000",
            zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ecd08880-5081-4d7a-afc3-ade1d6e6346f",
            statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
            resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
            informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
        )

        runner = HealthChecksRunner(checks_collector=checks_collector)
        failed_checks = runner.run_checks()

        self.assertEqual(len(failed_checks), 0)

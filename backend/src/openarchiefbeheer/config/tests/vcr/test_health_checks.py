from django.test import TestCase
from django.utils.translation import gettext as _

from maykin_config_checks import run_checks
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ...health_checks import (
    APIConfigCheck,
    ArchiveConfigHealthCheck,
    ServiceConfigurationHealthCheck,
    ServiceHealthCheck,
)
from ..factories import (
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

        def checks_collector():
            return [
                ServiceHealthCheck(),
                ServiceConfigurationHealthCheck(),
                APIConfigCheck(),
                ArchiveConfigHealthCheck(),
            ]

        failed_checks = list(
            run_checks(checks_collector=checks_collector, include_success=False)
        )

        self.assertEqual(len(failed_checks), 1)
        self.assertEqual(failed_checks[0].identifier, "services_configuration")
        self.assertEqual(len(failed_checks[0].extra), 5)
        self.assertEqual(
            sorted([extra_info.message for extra_info in failed_checks[0].extra]),
            sorted(
                [
                    _("Connection check failed for Service: %(label)s")
                    % {"label": service_zrc.label},
                    _("Connection check failed for Service: %(label)s")
                    % {"label": service_brc.label},
                    _("Connection check failed for Service: %(label)s")
                    % {"label": service_drc.label},
                    _("Connection check failed for Service: %(label)s")
                    % {"label": service_ztc.label},
                    _("Connection check failed for Service: %(label)s")
                    % {"label": service.label},
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

        def checks_collector():
            return [
                ServiceHealthCheck(),
                ServiceConfigurationHealthCheck(),
                APIConfigCheck(),
                ArchiveConfigHealthCheck(),
            ]

        failed_checks = list(
            run_checks(checks_collector=checks_collector, include_success=False)
        )

        self.assertEqual(len(failed_checks), 0)

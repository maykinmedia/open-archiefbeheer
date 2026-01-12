from django.test import TestCase

from maykin_config_checks import run_checks
from zgw_consumers.models import Service

from openarchiefbeheer.config.health_checks import (
    APIConfigCheck,
    ArchiveConfigHealthCheck,
    ServiceConfigurationHealthCheck,
    ServiceHealthCheck,
)
from openarchiefbeheer.config.tests.factories import (
    APIConfigFactory,
    ArchiveConfigFactory,
)


class TestHealthChecks(TestCase):
    def test_nothing_configured(self):
        Service.objects.all().delete()
        APIConfigFactory.create(selectielijst_api_service=None)
        ArchiveConfigFactory.create(
            zaaktypes_short_process=[],
            bronorganisatie="",
            zaaktype="",
            statustype="",
            resultaattype="",
            informatieobjecttype="",
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

        self.assertEqual(len(failed_checks), 3)
        self.assertEqual(failed_checks[0].identifier, "services_presence")
        self.assertEqual(failed_checks[1].identifier, "apiconfig")
        self.assertEqual(failed_checks[2].identifier, "archiveconfig")

        self.assertEqual(failed_checks[1].extra[0].field, "selectielijst_api_service")
        self.assertEqual(failed_checks[2].extra[0].field, "bronorganisatie")
        self.assertEqual(failed_checks[2].extra[1].field, "zaaktype")
        self.assertEqual(failed_checks[2].extra[2].field, "resultaattype")
        self.assertEqual(failed_checks[2].extra[3].field, "informatieobjecttype")

    def test_zaaktype_identificatie_instead_of_url(self):
        ArchiveConfigFactory.create(
            zaaktypes_short_process=[],
            bronorganisatie="123456782",
            zaaktype="INVALID-IDENTIFICATIE",
            statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
            resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
            informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
        )

        check_result = list(
            run_checks(
                checks_collector=lambda: [ArchiveConfigHealthCheck()],
                include_success=True,
            )
        )[0]

        self.assertFalse(check_result.success)
        self.assertEqual(check_result.extra[0].field, "zaaktype")
        self.assertEqual(check_result.extra[0].code, "invalid_field")

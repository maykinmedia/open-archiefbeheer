from django.test import TestCase

from maykin_health_checks.runner import HealthChecksRunner
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

        runner = HealthChecksRunner(checks_collector=checks_collector)
        failed_checks = list(runner.run_checks())

        self.assertEqual(len(failed_checks), 3)
        self.assertEqual(failed_checks[0].identifier, "services_presence")
        self.assertEqual(failed_checks[1].identifier, "apiconfig")
        self.assertEqual(failed_checks[2].identifier, "archiveconfig")

        self.assertEqual(failed_checks[1].extra[0].field, "selectielijst_api_service")
        self.assertEqual(failed_checks[2].extra[0].field, "bronorganisatie")
        self.assertEqual(failed_checks[2].extra[1].field, "zaaktype")
        self.assertEqual(failed_checks[2].extra[2].field, "resultaattype")
        self.assertEqual(failed_checks[2].extra[3].field, "informatieobjecttype")

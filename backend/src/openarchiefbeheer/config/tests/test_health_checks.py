from unittest.mock import patch

from django.test import TestCase

from zgw_consumers.models import Service

from ..health_checks import (
    API_CONFIG_ERRORS,
    ARCHIVE_CONFIG_ERRORS,
    SERVICES_ERRORS,
    is_configuration_complete,
)
from ..models import APIConfig, ArchiveConfig


class TestHealthChecks(TestCase):
    def test_nothing_configured(self):
        Service.objects.all().delete()

        with (
            patch(
                "openarchiefbeheer.config.health_checks.APIConfig.get_solo",
                return_value=APIConfig(),
            ),
            patch(
                "openarchiefbeheer.config.health_checks.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(),
            ),
        ):
            result = is_configuration_complete()

        self.assertFalse(result["success"])

        expected_errors = [
            SERVICES_ERRORS["MISSING_ZRC_SERVICE"],
            SERVICES_ERRORS["MISSING_DRC_SERVICE"],
            SERVICES_ERRORS["MISSING_BRC_SERVICE"],
            SERVICES_ERRORS["MISSING_ZTC_SERVICE"],
            API_CONFIG_ERRORS["MISSING_SELECTIELIJST_API"],
            ARCHIVE_CONFIG_ERRORS["MISSING_BRONORGANISATIE"],
            ARCHIVE_CONFIG_ERRORS["MISSING_ZAAKTYPE"],
            ARCHIVE_CONFIG_ERRORS["MISSING_SELECTIELIJSTKLASSE"],
            ARCHIVE_CONFIG_ERRORS["MISSING_INFORMATIEOBJECTTYPE"],
        ]

        self.assertEqual(expected_errors, result["errors"])

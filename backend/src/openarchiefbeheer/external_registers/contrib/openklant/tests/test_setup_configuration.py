from pathlib import Path

from django.test import TestCase

from django_setup_configuration.exceptions import PrerequisiteFailed
from django_setup_configuration.test_utils import execute_single_step
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.external_registers.setup_configuration.steps import (
    ExternalRegisterPluginsConfigurationStep,
)
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin

from ....models import ExternalRegisterConfig
from ..constants import OPENKLANT_IDENTIFIER

TEST_FILES = (Path(__file__).parent / "files").resolve()
CONFIG_FILE_PATH = str(TEST_FILES / "external_registers.yaml")
BROKEN_CONFIG_FILE_PATH = str(TEST_FILES / "broken_config.yaml")


class ExternalRegistersConfigurationStepTests(ClearCacheMixin, TestCase):
    def test_configure_external_registers(self):
        ServiceFactory.create(slug="openklant_service1")
        ServiceFactory.create(slug="openklant_service2")
        config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)

        execute_single_step(
            ExternalRegisterPluginsConfigurationStep, yaml_source=CONFIG_FILE_PATH
        )

        config.refresh_from_db()

        self.assertTrue(config.enabled)
        self.assertEqual(config.services.count(), 2)
        self.assertEqual(
            list(config.services.all().order_by("slug").values_list("slug", flat=True)),
            ["openklant_service1", "openklant_service2"],
        )

    def test_wrong_configuration(self):
        with self.assertRaises(
            PrerequisiteFailed,
            msg="Failed to load config model for External registers. "
            "Further details: 1 validation error for ConfigSettingsSourceExternal_registers",
        ):
            execute_single_step(
                ExternalRegisterPluginsConfigurationStep,
                yaml_source=BROKEN_CONFIG_FILE_PATH,
            )

from pathlib import Path

from django.core.cache import cache
from django.test import TestCase

from django_setup_configuration.exceptions import ConfigurationRunFailed
from django_setup_configuration.test_utils import execute_single_step
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ...models import APIConfig
from ..steps import APIConfigConfigurationStep

TEST_FILES = (Path(__file__).parent / "files").resolve()
CONFIG_FILE_PATH = str(TEST_FILES / "setup_config_api.yaml")


class APIConfigConfigurationStepTests(TestCase):
    def setUp(self):
        super().setUp()

        self.addCleanup(cache.clear)

    def test_configure_api_config_create_new(self):
        service = ServiceFactory(
            slug="selectielijst",
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1/",
        )
        config = APIConfig.get_solo()

        self.assertIsNone(config.selectielijst_api_service)

        execute_single_step(APIConfigConfigurationStep, yaml_source=CONFIG_FILE_PATH)

        config.refresh_from_db()

        self.assertEqual(service.pk, config.selectielijst_api_service.pk)

    def test_configure_api_config_update_existing(self):
        service1 = ServiceFactory(
            slug="selectielijst",
        )
        service2 = ServiceFactory(
            slug="selectielijst-new",
        )

        config = APIConfig.get_solo()
        config.selectielijst_api_service = service1
        config.save()

        execute_single_step(
            APIConfigConfigurationStep,
            object_source={
                "api_configuration_enabled": True,
                "api_configuration": {
                    "selectielijst_service_identifier": "selectielijst-new"
                },
            },
        )

        config.refresh_from_db()

        self.assertEqual(service2.pk, config.selectielijst_api_service.pk)

    def test_configure_api_config_missing_service(self):
        with self.assertRaises(ConfigurationRunFailed):
            execute_single_step(
                APIConfigConfigurationStep, yaml_source=CONFIG_FILE_PATH
            )

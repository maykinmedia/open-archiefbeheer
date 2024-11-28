from pathlib import Path
from unittest.mock import Mock, patch

from django.core.cache import cache
from django.test import TestCase

from django_setup_configuration.test_utils import execute_single_step
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service
from zgw_consumers.test.factories import ServiceFactory

from ...models import APIConfig
from ..steps import APIConfigConfigurationStep

TEST_FILES = (Path(__file__).parent / "files").resolve()
CONFIG_FILE_PATH_1 = str(TEST_FILES / "setup_config_api.yaml")
CONFIG_FILE_PATH_2 = str(TEST_FILES / "setup_config_api_different_service.yaml")


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

        execute_single_step(APIConfigConfigurationStep, yaml_source=CONFIG_FILE_PATH_1)

        config = APIConfig.get_solo()

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

        execute_single_step(APIConfigConfigurationStep, yaml_source=CONFIG_FILE_PATH_2)

        config.refresh_from_db()

        self.assertEqual(service2.pk, config.selectielijst_api_service.pk)

    def test_configure_api_config_missing_service(self):
        with self.assertRaises(Service.DoesNotExist):
            execute_single_step(
                APIConfigConfigurationStep, yaml_source=CONFIG_FILE_PATH_1
            )

    def test_idempotency(self):
        service = ServiceFactory(
            slug="selectielijst",
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1/",
        )

        execute_single_step(APIConfigConfigurationStep, yaml_source=CONFIG_FILE_PATH_1)

        mock = Mock()
        config = APIConfig(selectielijst_api_service=service)
        with patch.object(config, "save", new=mock.method):
            with patch(
                "openarchiefbeheer.config.setup_configuration.steps.APIConfig.get_solo",
                return_value=config,
            ):
                execute_single_step(
                    APIConfigConfigurationStep, yaml_source=CONFIG_FILE_PATH_1
                )

        mock.method.assert_not_called()

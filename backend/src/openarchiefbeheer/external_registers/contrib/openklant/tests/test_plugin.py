from django.test import TestCase

from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin

from ....models import ExternalRegisterConfig
from ..constants import OPENKLANT_IDENTIFIER


class OpenKlantPluginTests(ClearCacheMixin, TestCase):
    def test_plugin_disabled(self):
        config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
        config.enabled = False
        config.save()

        plugin = register[OPENKLANT_IDENTIFIER]
        result = plugin.check_config()

        self.assertTrue(result.success)

    def test_no_services_configured(self):
        config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
        config.enabled = True
        config.save()

        plugin = register[OPENKLANT_IDENTIFIER]
        result = plugin.check_config()

        self.assertFalse(result.success)
        self.assertEqual(result.extra[0].code, "missing_service")

    def test_fully_configured(self):
        service = ServiceFactory.create()
        config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
        config.enabled = True
        config.services.add(service)
        config.save()

        plugin = register[OPENKLANT_IDENTIFIER]
        result = plugin.check_config()

        self.assertTrue(result.success)

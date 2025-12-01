from django.test import TestCase

from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin

from .factories import OpenKlantConfigFactory


class OpenKlantPluginTests(ClearCacheMixin, TestCase):
    def test_plugin_disabled(self):
        config = OpenKlantConfigFactory.create()
        config.enabled = False
        config.save()

        plugin = register["openklant"]
        result = plugin.check_config()

        self.assertTrue(result.success)

    def test_no_services_configured(self):
        config = OpenKlantConfigFactory.create()
        config.enabled = True
        config.services.all().delete()
        config.save()

        plugin = register["openklant"]
        result = plugin.check_config()

        self.assertFalse(result.success)
        self.assertEqual(result.extra[0].code, "missing_service")

    def test_fully_configured(self):
        service = ServiceFactory.create()
        config = OpenKlantConfigFactory.create()
        config.enabled = True
        config.services.add(service)
        config.save()

        plugin = register["openklant"]
        result = plugin.check_config()

        self.assertTrue(result.success)

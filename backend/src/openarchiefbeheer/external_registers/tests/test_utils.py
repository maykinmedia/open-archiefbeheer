from collections.abc import Iterable
from typing import NoReturn
from unittest.mock import patch

from django.test import TestCase

from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.destruction.models import DestructionListItem

from ..plugin import AbstractBasePlugin
from ..registry import Registry
from ..utils import get_plugin_for_related_object


class DummyPlugin(AbstractBasePlugin):
    def get_admin_url(self, resource_url: str) -> str:
        return ""

    def delete_related_resources(
        self, item: DestructionListItem, related_resources: Iterable[str]
    ) -> None | NoReturn:
        return


class UtilsTest(TestCase):
    def test_retrieve_plugin_for_zaakobject_no_plugin(self):
        ServiceFactory.create(api_root="http://register.nl/api/v1/")

        plugin = get_plugin_for_related_object("http://register.nl/api/v1/resource/1")

        self.assertIsNone(plugin)

    def test_retrieve_plugin_for_zaakobject_no_service(self):
        plugin = get_plugin_for_related_object("http://register.nl/api/v1/resource/1")

        self.assertIsNone(plugin)

    def test_retrieve_plugin_for_zaakobject(self):
        registry = Registry()
        registry("dummy")(DummyPlugin)
        plugin = registry["dummy"]
        service = ServiceFactory.create(api_root="http://register.nl/api/v1/")

        config = plugin.get_or_create_config()
        config.enabled = True
        config.services.add(service)
        config.save()

        with patch("openarchiefbeheer.external_registers.utils.registry", new=registry):
            retrieved_plugin = get_plugin_for_related_object(
                "http://register.nl/api/v1/resource/1"
            )

        assert retrieved_plugin
        self.assertEqual(retrieved_plugin.identifier, "dummy")

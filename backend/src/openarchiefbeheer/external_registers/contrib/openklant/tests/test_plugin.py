from django.test import TestCase

from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes, AuthTypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.utils.results_store import ResultStore
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin
from openarchiefbeheer.utils.tests.resources_client import OpenZaakDataCreationHelper

from ....models import ExternalRegisterConfig
from ..constants import OPENKLANT_IDENTIFIER


class OpenKlantPluginTests(ClearCacheMixin, VCRMixin, TestCase):
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

    def test_delete_relations(self):
        service = ServiceFactory.create(
            slug="openklant",
            api_type=APITypes.orc,
            api_root="http://localhost:8005/klantinteracties/api/v1/",
            auth_type=AuthTypes.api_key,
            header_key="Authorization",
            header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
        )
        helper = OpenZaakDataCreationHelper(openklant_service_slug="openklant")
        onderwerpobject = helper.create_onderwerpobject()
        assert isinstance(onderwerpobject["url"], str)
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        result_store = ResultStore(store=item)
        config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
        config.enabled = True
        config.services.add(service)
        config.save()

        plugin = register[OPENKLANT_IDENTIFIER]
        plugin.delete_related_resources(
            zaak_url=item.zaak.url,
            related_resources=[onderwerpobject["url"]],
            result_store=result_store,
        )

        results = result_store.get_internal_results()
        self.assertEqual(
            results["deleted_resources"]["onderwerpobjecten"][0],
            onderwerpobject["url"],
        )

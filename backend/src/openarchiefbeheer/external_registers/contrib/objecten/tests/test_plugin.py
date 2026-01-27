from django.test import TestCase

import requests_mock
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes, AuthTypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.destruction.constants import ResourceDestructionResultStatus
from openarchiefbeheer.destruction.models import ResourceDestructionResult
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin
from openarchiefbeheer.utils.tests.resources_client import (
    ObjectenCreationHelper,
)

from ....models import ExternalRegisterConfig
from ..constants import OBJECTEN_IDENTIFIER


class ObjectenPluginTests(ClearCacheMixin, VCRMixin, TestCase):
    def test_plugin_disabled(self):
        config = ExternalRegisterConfig.objects.get(identifier=OBJECTEN_IDENTIFIER)
        config.enabled = False
        config.save()

        plugin = register[OBJECTEN_IDENTIFIER]
        result = plugin.check_config()

        self.assertTrue(result.success)

    def test_no_services_configured(self):
        config = ExternalRegisterConfig.objects.get(identifier=OBJECTEN_IDENTIFIER)
        config.enabled = True
        config.save()

        plugin = register[OBJECTEN_IDENTIFIER]
        result = plugin.check_config()

        self.assertFalse(result.success)
        self.assertEqual(result.extra[0].code, "missing_service")

    def test_fully_configured(self):
        service = ServiceFactory.create()
        config = ExternalRegisterConfig.objects.get(identifier=OBJECTEN_IDENTIFIER)
        config.enabled = True
        config.services.add(service)
        config.save()

        plugin = register[OBJECTEN_IDENTIFIER]
        result = plugin.check_config()

        self.assertTrue(result.success)

    def test_delete_relations(self):
        service = ServiceFactory.create(
            slug="objecten",
            api_type=APITypes.orc,
            api_root="http://localhost:8006/api/v2/",
            auth_type=AuthTypes.api_key,
            header_key="Authorization",
            header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
        )
        helper = ObjectenCreationHelper(objecten_service_slug="objecten")
        object_resource = helper.create_object()
        assert isinstance(object_resource["url"], str)
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        config = ExternalRegisterConfig.objects.get(identifier=OBJECTEN_IDENTIFIER)
        config.enabled = True
        config.services.add(service)
        config.save()

        plugin = register[OBJECTEN_IDENTIFIER]
        # TODO: test with real Objecten API once https://github.com/maykinmedia/objects-api/pull/719 is
        # merged and released!
        with requests_mock.Mocker(real_http=True) as m:
            m.delete(
                f"{object_resource['url']}?"
                "zaak=http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                status_code=204,
            )
            plugin.delete_related_resources(
                item=item,
                related_resources=[object_resource["url"]],
            )

        result = ResourceDestructionResult.objects.get(
            item=item,
            resource_type="objecten",
            status=ResourceDestructionResultStatus.deleted,
        )

        self.assertEqual(
            result.url,
            object_resource["url"],
        )

    def test_unlink_relations(self):
        service = ServiceFactory.create(
            slug="objecten",
            api_type=APITypes.orc,
            api_root="http://localhost:8006/api/v2/",
            auth_type=AuthTypes.api_key,
            header_key="Authorization",
            header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
        )
        item = DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        config = ExternalRegisterConfig.objects.get(identifier=OBJECTEN_IDENTIFIER)
        config.enabled = True
        config.services.add(service)
        config.save()

        plugin = register[OBJECTEN_IDENTIFIER]

        # TODO: test with real Objecten API once https://github.com/maykinmedia/objects-api/pull/719 is
        # merged and released!
        with requests_mock.Mocker() as m:
            m.delete(
                "http://localhost:8006/api/v2/objects/5e8e9d9f-dbab-475f-8a8b-3e5a1b74d3ab?"
                "zaak=http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                status_code=200,
            )
            plugin.delete_related_resources(
                item=item,
                related_resources=[
                    "http://localhost:8006/api/v2/objects/5e8e9d9f-dbab-475f-8a8b-3e5a1b74d3ab"
                ],
            )

        result = ResourceDestructionResult.objects.get(
            item=item,
            resource_type="objecten",
        )

        self.assertEqual(result.status, ResourceDestructionResultStatus.unlinked)

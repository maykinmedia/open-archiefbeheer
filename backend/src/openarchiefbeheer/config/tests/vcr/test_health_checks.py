from unittest.mock import patch

from django.test import TestCase

from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ...health_checks import SERVICES_ERRORS, is_configuration_complete
from ...models import APIConfig, ArchiveConfig


class TestConfigurationHealthChecks(VCRMixin, TestCase):

    def test_services_badly_configured(self):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8002/zaken/api/v1",  # Wrong port
        )
        ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8002/documenten/api/v1",  # Wrong port
        )
        ServiceFactory.create(
            api_type=APITypes.brc,
            api_root="http://localhost:8002/besluiten/api/v1",  # Wrong port
        )
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8002/catalogi/api/v1",  # Wrong port
        )
        service = ServiceFactory(
            slug="selectielijst",
            api_type=APITypes.orc,
            api_root="https://selectielijst.non-existent.nl/api/v1/",
        )

        with (
            patch(
                "openarchiefbeheer.config.health_checks.APIConfig.get_solo",
                return_value=APIConfig(selectielijst_api_service=service),
            ),
            patch(
                "openarchiefbeheer.config.health_checks.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(
                    bronorganisatie="000000000",
                    zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ecd08880-5081-4d7a-afc3-ade1d6e6346f",
                    statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
                    resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
                    informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
                ),
            ),
        ):
            result = is_configuration_complete()

        self.assertFalse(result["success"])

        expected_errors = [
            SERVICES_ERRORS["IMPROPERLY_CONFIGURED_ZRC_SERVICE"],
            SERVICES_ERRORS["IMPROPERLY_CONFIGURED_DRC_SERVICE"],
            SERVICES_ERRORS["IMPROPERLY_CONFIGURED_BRC_SERVICE"],
            SERVICES_ERRORS["IMPROPERLY_CONFIGURED_ZTC_SERVICE"],
            SERVICES_ERRORS["IMPROPERLY_CONFIGURED_SELECTIELIJST_SERVICE"],
        ]

        self.assertEqual(expected_errors, result["errors"])

    def test_correctly_configured(self):
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        ServiceFactory.create(
            api_type=APITypes.brc,
            api_root="http://localhost:8003/besluiten/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        service = ServiceFactory(
            slug="selectielijst",
            api_type=APITypes.orc,
            api_root="https://selectielijst.openzaak.nl/api/v1/",
        )

        with (
            patch(
                "openarchiefbeheer.config.health_checks.APIConfig.get_solo",
                return_value=APIConfig(selectielijst_api_service=service),
            ),
            patch(
                "openarchiefbeheer.config.health_checks.ArchiveConfig.get_solo",
                return_value=ArchiveConfig(
                    bronorganisatie="000000000",
                    zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ecd08880-5081-4d7a-afc3-ade1d6e6346f",
                    statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
                    resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
                    informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
                ),
            ),
        ):
            result = is_configuration_complete()

        self.assertTrue(result["success"])
        self.assertEqual(len(result["errors"]), 0)

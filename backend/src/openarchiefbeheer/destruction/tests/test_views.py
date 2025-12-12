from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.util import underscoreize
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes, AuthTypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.external_registers.contrib.openklant.constants import (
    OPENKLANT_IDENTIFIER,
)
from openarchiefbeheer.external_registers.models import ExternalRegisterConfig
from openarchiefbeheer.utils.tests.resources_client import OpenZaakDataCreationHelper
from openarchiefbeheer.utils.utils_decorators import reload_openzaak_fixtures
from openarchiefbeheer.zaken.api.serializers import ZaakSerializer
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tasks import (
    retrieve_and_cache_zaken,
)


class StatusViewTests(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:destruction-list-statuses")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated(self):
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:destruction-list-statuses")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RelatedObjectsViewTests(VCRMixin, APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.zrc_service = ServiceFactory.create(
            slug="zaken",
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.ztc_service = ServiceFactory.create(
            slug="catalogi",
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )
        cls.openklant_service = ServiceFactory.create(
            slug="openklant",
            api_type=APITypes.orc,
            api_root="http://localhost:8005/klantinteracties/api/v1/",
            auth_type=AuthTypes.api_key,
            header_key="Authorization",
            header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
        )
        config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
        config.services.add(cls.openklant_service.pk)

    def test_not_authenticated(self):
        endpoint = reverse("api:destruction-items-relations", args=(1,))

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_not_supported_relation(self):
        user = UserFactory.create()

        helper = OpenZaakDataCreationHelper(
            zrc_service_slug="zaken",
            ztc_service_slug="catalogi",
            drc_service_slug="documents",
            openklant_service_slug="openklant",
        )
        resources = helper.create_zaaktype_with_relations()
        zaaktype = resources["zaaktype"]
        assert isinstance(zaaktype["url"], str) and isinstance(
            zaaktype["catalogus"], str
        )

        helper.publish_zaaktype(zaaktype["url"])

        zaak = helper.create_zaak(zaaktype_url=zaaktype["url"])

        assert isinstance(zaak, dict) and isinstance(zaak["url"], str)
        zaakobject = helper.create_zaakobject(
            zaak_url=zaak["url"],
            object_url="https://api.chucknorris.io/jokes/3kcaD8EnSKuRHKAi9Lt8HQ",
            **{
                "objectTypeOverige": "Chuck norris quote",
                "objectIdentificatie": {"overigeData": "3kcaD8EnSKuRHKAi9Lt8HQ"},
            },
        )

        serializer = ZaakSerializer(
            data=underscoreize(zaak, **CamelCaseJSONParser.json_underscoreize)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        item = DestructionListItemFactory.create(zaak=serializer.instance)

        endpoint = reverse("api:destruction-items-relations", args=(item.pk,))
        self.client.force_authenticate(user)
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(
            data[0],
            {
                "url": zaakobject["url"],
                "selected": False,
                "supported": False,
                "result": zaakobject,
            },
        )

    @reload_openzaak_fixtures(["RelatedObjectsViewTests_test_supported_relation.json"])
    def test_supported_relation(self):
        user = UserFactory.create()
        retrieve_and_cache_zaken(is_full_resync=True)

        item = DestructionListItemFactory.create(
            zaak=Zaak.objects.get(identificatie="ZAAK-2000-0000000001")
        )

        endpoint = reverse("api:destruction-items-relations", args=(item.pk,))
        self.client.force_authenticate(user)
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertTrue(data[0]["supported"])
        self.assertTrue(data[0]["selected"])
        self.assertEqual(
            data[0]["url"],
            "http://localhost:8003/zaken/api/v1/zaakobjecten/d0b27cb0-ec3d-44c0-9683-b53471834348",
        )
        self.assertEqual(
            data[0]["result"],
            {
                "url": "http://localhost:8003/zaken/api/v1/zaakobjecten/d0b27cb0-ec3d-44c0-9683-b53471834348",
                "uuid": "d0b27cb0-ec3d-44c0-9683-b53471834348",
                "zaak": "http://localhost:8003/zaken/api/v1/zaken/7eac038c-6675-4273-b794-7849508db496",
                "object": "http://localhost:8005/klantinteracties/api/v1/klantcontacten/1dfca717-ae24-4ba6-b656-695b121723a6",
                "zaakobjecttype": None,
                "objectType": "overige",
                "objectTypeOverige": "Klantcontact",
                "objectTypeOverigeDefinitie": {
                    "url": "http://localhost:8005/klantinteracties/api/v1/klantcontacten/1dfca717-ae24-4ba6-b656-695b121723a6",
                    "schema": "{}",
                    "objectData": "{}",
                },
                "relatieomschrijving": "",
                "objectIdentificatie": None,
            },
        )

    @reload_openzaak_fixtures(["RelatedObjectsViewTests_test_supported_relation.json"])
    def test_supported_not_selected(self):
        user = UserFactory.create()

        retrieve_and_cache_zaken(is_full_resync=True)

        item = DestructionListItemFactory.create(
            zaak=Zaak.objects.get(identificatie="ZAAK-2000-0000000001"),
            excluded_relations=[
                "http://localhost:8003/zaken/api/v1/zaakobjecten/d0b27cb0-ec3d-44c0-9683-b53471834348"
            ],
        )

        endpoint = reverse("api:destruction-items-relations", args=(item.pk,))
        self.client.force_authenticate(user)
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertFalse(data[0]["selected"])

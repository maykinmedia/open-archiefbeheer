from django.test import Client

import pytest
from freezegun import freeze_time
from rest_framework import status
from rest_framework.reverse import reverse
from vcr.cassette import Cassette
from zgw_consumers.constants import APITypes, AuthTypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.tests.factories import DestructionListItemFactory
from openarchiefbeheer.external_registers.contrib.openklant.constants import (
    OPENKLANT_IDENTIFIER,
)
from openarchiefbeheer.external_registers.models import ExternalRegisterConfig
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tasks import (
    retrieve_and_cache_zaken,
)


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["RelatedObjectsViewTests_test_supported_relation.json"])
def test_supported_zaak_relations(openzaak_reload: None, vcr: Cassette, client: Client):
    ServiceFactory.create(
        slug="zaken",
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    openklant_service = ServiceFactory.create(
        slug="openklant",
        api_type=APITypes.orc,
        api_root="http://localhost:8005/klantinteracties/api/v1/",
        auth_type=AuthTypes.api_key,
        header_key="Authorization",
        header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
    )
    config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
    config.services.add(openklant_service.pk)
    user = UserFactory.create()

    with freeze_time("2025-12-12"):
        retrieve_and_cache_zaken(is_full_resync=True)

    item = DestructionListItemFactory.create(
        zaak=Zaak.objects.get(identificatie="ZAAK-2000-0000000001")
    )

    endpoint = reverse("api:destruction-items-relations", args=(item.pk,))
    client.force_login(user)
    response = client.get(endpoint)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert data[0]["supported"]
    assert data[0]["selected"]
    assert (
        data[0]["url"]
        == "http://localhost:8003/zaken/api/v1/zaakobjecten/d0b27cb0-ec3d-44c0-9683-b53471834348"
    )

    assert data[0]["result"] == {
        "url": "http://localhost:8003/zaken/api/v1/zaakobjecten/d0b27cb0-ec3d-44c0-9683-b53471834348",
        "uuid": "d0b27cb0-ec3d-44c0-9683-b53471834348",
        "zaak": "http://localhost:8003/zaken/api/v1/zaken/7eac038c-6675-4273-b794-7849508db496",
        "object": "http://localhost:8005/klantinteracties/api/v1/onderwerpobjecten/1dfca717-ae24-4ba6-b656-695b121723a6",
        "zaakobjecttype": None,
        "objectType": "overige",
        "objectTypeOverige": "Onderwerpobject",
        "objectTypeOverigeDefinitie": {
            "url": "http://localhost:8005/klantinteracties/api/v1/onderwerpobjecten/1dfca717-ae24-4ba6-b656-695b121723a6",
            "schema": "{}",
            "objectData": "{}",
        },
        "relatieomschrijving": "",
        "objectIdentificatie": None,
    }


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["RelatedObjectsViewTests_test_supported_relation.json"])
def test_supported_zaak_relations_not_selected(
    openzaak_reload: None, vcr: Cassette, client: Client
):
    user = UserFactory.create()
    ServiceFactory.create(
        slug="zaken",
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    openklant_service = ServiceFactory.create(
        slug="openklant",
        api_type=APITypes.orc,
        api_root="http://localhost:8005/klantinteracties/api/v1/",
        auth_type=AuthTypes.api_key,
        header_key="Authorization",
        header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
    )
    config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
    config.services.add(openklant_service.pk)

    with freeze_time("2025-12-12"):
        retrieve_and_cache_zaken(is_full_resync=True)

    item = DestructionListItemFactory.create(
        zaak=Zaak.objects.get(identificatie="ZAAK-2000-0000000001"),
        excluded_relations=[
            "http://localhost:8003/zaken/api/v1/zaakobjecten/d0b27cb0-ec3d-44c0-9683-b53471834348"
        ],
    )

    endpoint = reverse("api:destruction-items-relations", args=(item.pk,))
    client.force_login(user)
    response = client.get(endpoint)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 1
    assert not data[0]["selected"]

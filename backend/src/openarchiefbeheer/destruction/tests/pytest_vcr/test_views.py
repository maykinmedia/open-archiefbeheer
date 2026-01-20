from unittest.mock import patch

from django.test import Client
from django.utils.translation import gettext as _

import pytest
import requests
import requests_mock
from freezegun import freeze_time
from rest_framework import status
from rest_framework.reverse import reverse
from vcr.cassette import Cassette
from zgw_consumers.constants import APITypes, AuthTypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.tests.factories import ArchiveConfigFactory
from openarchiefbeheer.destruction.constants import InternalStatus, ListStatus
from openarchiefbeheer.destruction.destruction_report import (
    upload_destruction_report_to_openzaak,
)
from openarchiefbeheer.destruction.models import DestructionList
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
)
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


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["complex_relations.json"])
def test_retrieve_destruction_report(
    openzaak_reload: None, vcr: Cassette, client: Client
):
    user = UserFactory.create(post__can_start_destruction=True)
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
        api_type=APITypes.ztc,
        api_root="http://localhost:8003/catalogi/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )

    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.new,
        status=ListStatus.deleted,
        with_report=True,
    )

    ArchiveConfigFactory.create(
        bronorganisatie="000000000",
        zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ce9feadd-00cb-46c8-a0ef-1d1dfc78586a",
        statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
        resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
        informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
    )

    upload_destruction_report_to_openzaak(destruction_list)

    client.force_login(user=user)
    response = client.get(
        reverse(
            "api:destructionlist-download-report",
            kwargs={"uuid": destruction_list.uuid},
        ),
    )

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_retrieve_report_not_found_in_openzaak(vcr: Cassette, client: Client):
    user = UserFactory.create(post__can_start_destruction=True)
    ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.new,
        status=ListStatus.deleted,
    )
    # Does not exist in openzaak
    destruction_list.zaak_destruction_report_url = (
        "http://localhost:8003/zaken/api/v1/zaken/71e87eed-5989-4a74-83a0-9234be373fe3"
    )
    destruction_list.save()

    client.force_login(user=user)
    response = client.get(
        reverse(
            "api:destructionlist-download-report",
            kwargs={"uuid": destruction_list.uuid},
        ),
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_unexpected_error_response_from_openzaak_when_retrieving_report(client: Client):
    user = UserFactory.create(post__can_start_destruction=True)
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
    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.new,
        status=ListStatus.deleted,
        zaak_destruction_report_url="http://localhost:8003/zaken/api/v1/zaken/71e87eed-5989-4a74-83a0-9234be373fe3",
    )

    client.force_login(user=user)
    with (
        requests_mock.Mocker(real_http=True) as m,
        patch.object(
            DestructionList,
            "get_destruction_report_url",
            return_value="http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/add3cc62-00be-4843-8050-1c77da51830d",
        ),
    ):
        m.get(
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/add3cc62-00be-4843-8050-1c77da51830d",
            status_code=500,
        )

        response = client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

    assert response.status_code == status.HTTP_502_BAD_GATEWAY
    assert response.json()["detail"] == _("Error response received from Open Zaak.")


@pytest.mark.django_db
def test_openzaak_down_when_retrieving_report(client: Client):
    user = UserFactory.create(post__can_start_destruction=True)
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
    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.new,
        status=ListStatus.deleted,
        zaak_destruction_report_url="http://localhost:8003/zaken/api/v1/zaken/71e87eed-5989-4a74-83a0-9234be373fe3",
    )

    client.force_login(user=user)
    with (
        requests_mock.Mocker(real_http=True) as m,
        patch.object(
            DestructionList,
            "get_destruction_report_url",
            return_value="http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/add3cc62-00be-4843-8050-1c77da51830d",
        ),
    ):
        m.get(
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/add3cc62-00be-4843-8050-1c77da51830d",
            exc=requests.exceptions.ConnectionError,
        )

        response = client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

    assert response.status_code == status.HTTP_502_BAD_GATEWAY
    assert response.json()["detail"] == _("Could not connect to Open Zaak.")

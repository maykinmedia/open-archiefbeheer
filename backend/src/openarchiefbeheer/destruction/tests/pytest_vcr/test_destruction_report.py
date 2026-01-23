import contextlib

import pytest
import requests_mock
from requests.exceptions import HTTPError
from vcr.cassette import Cassette
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.tests.factories import ArchiveConfigFactory
from openarchiefbeheer.destruction.destruction_report import (
    upload_destruction_report_to_openzaak,
)
from openarchiefbeheer.destruction.models import (
    ResourceCreationResult,
)

from ...constants import InternalStatus, ListStatus
from ..factories import DestructionListFactory


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["complex_relations.json"])
def test_upload_destruction_report(openzaak_reload: None, vcr: Cassette):
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

    destruction_list.refresh_from_db()

    assert (
        destruction_list.zaak_destruction_report_url
        == "http://localhost:8003/zaken/api/v1/zaken/2fbf2424-2191-4101-b4a5-ffee92a588ec"
    )
    assert vcr.requests[-1].method == "POST"
    assert (
        vcr.requests[-1].url
        == "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten"
    )
    assert vcr.requests[-2].method == "POST"
    assert (
        vcr.requests[-2].url
        == "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten"
    )
    assert vcr.requests[-3].method == "POST"
    assert vcr.requests[-3].url == "http://localhost:8003/zaken/api/v1/statussen"
    assert vcr.requests[-4].method == "POST"
    assert vcr.requests[-4].url == "http://localhost:8003/zaken/api/v1/resultaten"
    assert vcr.requests[-5].method == "POST"
    assert vcr.requests[-5].url == "http://localhost:8003/zaken/api/v1/zaken"


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["complex_relations.json"])
def test_upload_destruction_report_no_statustype_configured(
    openzaak_reload: None, vcr: Cassette
):
    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.new,
        status=ListStatus.deleted,
        with_report=True,
    )
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
    ArchiveConfigFactory.create(
        bronorganisatie="000000000",
        zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ce9feadd-00cb-46c8-a0ef-1d1dfc78586a",
        informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
        resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
    )

    upload_destruction_report_to_openzaak(destruction_list)

    destruction_list.refresh_from_db()

    assert (
        destruction_list.zaak_destruction_report_url
        == "http://localhost:8003/zaken/api/v1/zaken/19450d44-68fc-48aa-9224-ae73967a9b2f"
    )
    assert (
        vcr.requests[-1].url
        == "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten"
    )


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["complex_relations.json"])
def test_failure_during_zaak_creation(openzaak_reload: None, vcr: Cassette):
    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.new,
        status=ListStatus.deleted,
        with_report=True,
    )
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
    ArchiveConfigFactory.create(
        bronorganisatie="000000000",
        zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ce9feadd-00cb-46c8-a0ef-1d1dfc78586a",
        statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
        resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
        informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
    )

    with requests_mock.Mocker(real_http=True) as m, contextlib.suppress(HTTPError):
        m.post("http://localhost:8003/zaken/api/v1/zaken", status_code=500)

        upload_destruction_report_to_openzaak(destruction_list)

    destruction_list.refresh_from_db()

    assert destruction_list.zaak_destruction_report_url == ""


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["complex_relations.json"])
def test_failure_when_creating_zio(openzaak_reload: None, vcr: Cassette):
    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.new,
        status=ListStatus.deleted,
        with_report=True,
    )
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
    ArchiveConfigFactory.create(
        bronorganisatie="000000000",
        zaaktype="http://localhost:8003/catalogi/api/v1/zaaktypen/ce9feadd-00cb-46c8-a0ef-1d1dfc78586a",
        statustype="http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
        resultaattype="http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
        informatieobjecttype="http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
    )

    with requests_mock.Mocker(real_http=True) as m, contextlib.suppress(HTTPError):
        m.post(
            "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten", status_code=500
        )

        upload_destruction_report_to_openzaak(destruction_list)

    destruction_list.refresh_from_db()

    assert (
        destruction_list.zaak_destruction_report_url
        == "http://localhost:8003/zaken/api/v1/zaken/da9c7c6d-3a02-4fc6-a3dc-f9d2b10b34be"
    )
    assert (
        ResourceCreationResult.objects.get(
            destruction_list=destruction_list, resource_type="resultaten"
        ).url
        == "http://localhost:8003/zaken/api/v1/resultaten/119d9a23-000a-47a6-a53a-d33c987e0b7d"
    )
    assert (
        ResourceCreationResult.objects.get(
            destruction_list=destruction_list, resource_type="statussen"
        ).url
        == "http://localhost:8003/zaken/api/v1/statussen/62424df0-2802-45c1-9c1c-634ea9d86651"
    )
    assert (
        ResourceCreationResult.objects.get(
            destruction_list=destruction_list,
            resource_type="enkelvoudiginformatieobjecten",
        ).url
        == "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/2b75b1d0-c247-4a1e-8120-18ed1c202a90"
    )

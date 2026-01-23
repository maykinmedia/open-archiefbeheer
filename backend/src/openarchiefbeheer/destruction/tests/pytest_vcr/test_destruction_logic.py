import os
from unittest.mock import patch

from django.core.exceptions import ObjectDoesNotExist
from django.core.files.base import ContentFile

import pytest
import requests_mock
from freezegun import freeze_time
from furl import furl
from pytest_django.fixtures import SettingsWrapper
from vcr.cassette import Cassette
from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes, AuthTypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.tests.factories import (
    APIConfigFactory,
)
from openarchiefbeheer.destruction.constants import (
    InternalStatus,
    ListStatus,
    ResourceDestructionResultStatus,
)
from openarchiefbeheer.destruction.destruction_logic import (
    delete_external_relations,
)
from openarchiefbeheer.destruction.models import (
    ResourceDestructionResult,
)
from openarchiefbeheer.destruction.tasks import (
    complete_and_notify,
    delete_destruction_list,
    delete_destruction_list_item,
)
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
)
from openarchiefbeheer.external_registers.contrib.openklant.constants import (
    OPENKLANT_IDENTIFIER,
)
from openarchiefbeheer.external_registers.models import ExternalRegisterConfig
from openarchiefbeheer.logging import logevent
from openarchiefbeheer.utils.tests.resources_client import (
    OpenKlantCreationHelper,
    OpenZaakDataCreationHelper,
)
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tasks import (
    resync_zaken,
)


@pytest.mark.django_db
def test_destroy_external_relations(vcr: Cassette):
    item = DestructionListItemFactory.create(
        with_zaak=True,
        zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
    )
    ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
    )
    ok_service = ServiceFactory.create(
        slug="openklant",
        api_type=APITypes.orc,
        api_root="http://localhost:8005/klantinteracties/api/v1/",
        auth_type=AuthTypes.api_key,
        header_key="Authorization",
        header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
    )
    config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
    config.enabled = True
    config.services.add(ok_service)
    config.save()
    helper = OpenKlantCreationHelper(openklant_service_slug="openklant")
    onderwerpobject = helper.create_onderwerpobject()
    assert isinstance(onderwerpobject["url"], str)

    with requests_mock.mock(real_http=True) as m:
        # TODO: Replace with real interactions once it is possible to do this in Open Zaak
        # (https://github.com/open-zaak/open-zaak/issues/2269)
        m.get(
            "http://localhost:8003/zaken/api/v1/zaakobjecten"
            "?zaak=http%3A%2F%2Flocalhost%3A8003%2Fzaken%2Fapi%2Fv1%2Fzaken%2F111-111-111",
            json={
                "count": 1,
                "results": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/zaakobjecten/111-111-111",
                        "object": onderwerpobject["url"],
                    }
                ],
            },
        )

        delete_external_relations(
            item,
        )

    result = ResourceDestructionResult.objects.get(
        item=item,
        resource_type="onderwerpobjecten",
        status=ResourceDestructionResultStatus.deleted,
    )

    assert result.url == onderwerpobject["url"]

    client = build_client(ok_service)
    response = client.get(onderwerpobject["url"])

    assert response.status_code == 404


@pytest.mark.django_db
def test_delete_external_relations_except_excluded(vcr: Cassette):
    item = DestructionListItemFactory.create(
        with_zaak=True,
        zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        excluded_relations=[
            "http://localhost:8003/zaken/api/v1/zaakobjecten/111-111-111"
        ],
    )
    ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
    )
    ok_service = ServiceFactory.create(
        slug="openklant",
        api_type=APITypes.orc,
        api_root="http://localhost:8005/klantinteracties/api/v1/",
        auth_type=AuthTypes.api_key,
        header_key="Authorization",
        header_value="Token ba9d233e95e04c4a8a661a27daffe7c9bd019067",
    )
    config = ExternalRegisterConfig.objects.get(identifier=OPENKLANT_IDENTIFIER)
    config.enabled = True
    config.services.add(ok_service)
    config.save()
    helper = OpenKlantCreationHelper(openklant_service_slug="openklant")
    onderwerpobject1 = helper.create_onderwerpobject()
    onderwerpobject2 = helper.create_onderwerpobject()
    assert isinstance(onderwerpobject1["url"], str) and isinstance(
        onderwerpobject2["url"], str
    )

    with requests_mock.mock(real_http=True) as m:
        # TODO: Replace with real interactions once it is possible to do this in Open Zaak
        # (https://github.com/open-zaak/open-zaak/issues/2269)
        m.get(
            "http://localhost:8003/zaken/api/v1/zaakobjecten"
            "?zaak=http%3A%2F%2Flocalhost%3A8003%2Fzaken%2Fapi%2Fv1%2Fzaken%2F111-111-111",
            json={
                "count": 1,
                "results": [
                    {
                        "url": "http://localhost:8003/zaken/api/v1/zaakobjecten/111-111-111",
                        "object": onderwerpobject1["url"],
                    },
                    {
                        "url": "http://localhost:8003/zaken/api/v1/zaakobjecten/222-222-222",
                        "object": onderwerpobject2["url"],
                    },
                ],
            },
        )

        delete_external_relations(item)

    results = ResourceDestructionResult.objects.filter(
        item=item,
        resource_type="onderwerpobjecten",
        status=ResourceDestructionResultStatus.deleted,
    )

    assert results.count() == 1
    assert results.get().url == onderwerpobject2["url"]


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["zaken.json"])
def test_item_deletion(openzaak_reload: None, vcr: Cassette):
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
    ServiceFactory.create(
        api_type=APITypes.brc,
        api_root="http://localhost:8003/besluiten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    with freeze_time("2026-01-22"):
        resync_zaken()

    item = DestructionListItemFactory.create(
        zaak=Zaak.objects.get(identificatie="ZAAK-ID-0"),
    )

    delete_destruction_list_item(item.pk)

    results = ResourceDestructionResult.objects.filter(
        item=item, status=ResourceDestructionResultStatus.deleted, resource_type="zaken"
    )

    assert results.count() == 1
    assert (
        results.get().url
        == "http://localhost:8003/zaken/api/v1/zaken/fb2706d3-5418-4173-9350-b7e71dcde5dd"
    )

    with pytest.raises(ObjectDoesNotExist):
        Zaak.objects.get(
            url="http://localhost:8003/zaken/api/v1/zaken/fb2706d3-5418-4173-9350-b7e71dcde5dd"
        )


@pytest.mark.django_db
def test_delete_item_zaak_not_found(vcr: Cassette):
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
    ServiceFactory.create(
        api_type=APITypes.brc,
        api_root="http://localhost:8003/besluiten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )

    item = DestructionListItemFactory.create(
        with_zaak=True,  # This zaak does not exist in Open Zaak
    )

    delete_destruction_list_item(item.pk)

    item.refresh_from_db()

    assert item.processing_status == InternalStatus.failed


@pytest.mark.django_db
def test_zaak_metadata_present_after_deletion(openzaak_reload: None, vcr: Cassette):
    # ---------- Setting up test data
    ServiceFactory.create(
        api_type=APITypes.zrc,
        slug="zaken",
        label="Open Zaak - Zaken API",
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.drc,
        slug="documenten",
        api_root="http://localhost:8003/documenten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.ztc,
        slug="catalogi",
        api_root="http://localhost:8003/catalogi/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.brc,
        slug="besluiten",
        api_root="http://localhost:8003/besluiten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    APIConfigFactory.create()
    helper = OpenZaakDataCreationHelper(
        zrc_service_slug="zaken",
        ztc_service_slug="catalogi",
        drc_service_slug="documents",
    )
    resources = helper.create_zaaktype_with_relations(
        omschrijving="Test OAB zaaktype",
        identificatie="ZAAKTYPE-2018-0000000001",
        selectielijst_procestype="https://selectielijst.openzaak.nl/api/v1/procestypen/aa8aa2fd-b9c6-4e34-9a6c-58a677f60ea0",
    )
    helper.publish_zaaktype(resources["zaaktype"]["url"])
    zaak = helper.create_zaak(
        zaaktype_url=resources["zaaktype"]["url"],
        omschrijving="Test OAB zaak",
        startdatum="2020-01-01",
    )
    helper.close_zaak(
        zaak_url=zaak["url"],
        resultaattype_url=resources["resultaattype"]["url"],
        statustype_url=resources["statustypen"][1]["url"],
        toelichting="Closing zaak.",
    )

    with freeze_time("2026-01-22"):
        resync_zaken()

    # ---------- Testing destruction

    item = DestructionListItemFactory.create(
        zaak=Zaak.objects.get(omschrijving="Test OAB zaak"),
    )

    delete_destruction_list_item(item.pk)

    item.refresh_from_db()

    assert item.processing_status == InternalStatus.succeeded

    results = ResourceDestructionResult.objects.filter(
        item=item, status=ResourceDestructionResultStatus.deleted, resource_type="zaken"
    )

    assert results.count() == 1

    result = results.get()

    assert result.url == zaak["url"]
    assert result.metadata["url"] == zaak["url"]
    assert result.metadata["bronapplicatie"] == "Open Zaak - Zaken API"
    assert result.metadata["omschrijving"] == "Test OAB zaak"
    assert result.metadata["identificatie"] == zaak["identificatie"]
    assert result.metadata["startdatum"] == "2020-01-01"
    assert result.metadata["einddatum"] == "2022-01-01"
    assert (
        result.metadata["zaaktype"]["uuid"]
        == furl(resources["zaaktype"]["url"]).path.segments[-1]
    )
    assert result.metadata["zaaktype"]["url"] == resources["zaaktype"]["url"]
    assert result.metadata["zaaktype"]["identificatie"] == "ZAAKTYPE-2018-0000000001"
    assert (
        result.metadata["zaaktype"]["selectielijst_procestype"]["naam"]
        == "Instellen en inrichten organisatie"
    )
    assert (
        result.metadata["resultaat"]
        == {
            "url": "http://localhost:8003/zaken/api/v1/resultaten/a0d0875f-5bd7-41f0-8eeb-0e8912581da0",  # Taken from the cassette
            "resultaattype": {"omschrijving": "Gegrond"},
        }
    )


@pytest.mark.django_db
def test_clean_local_metadata(vcr: Cassette):
    # ---------- Setting up test data
    ServiceFactory.create(
        api_type=APITypes.zrc,
        slug="zaken",
        label="Open Zaak - Zaken API",
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    destruction_list = DestructionListFactory.create(
        processing_status=InternalStatus.processing,
        status=ListStatus.deleted,
        destruction_report=ContentFile(b"Hello I am a report.", name="report_test.txt"),
    )

    path = destruction_list.destruction_report.path
    assert destruction_list.destruction_report
    assert os.path.isfile(path)

    item1 = DestructionListItemFactory.create(
        processing_status=InternalStatus.succeeded,
        destruction_list=destruction_list,
    )
    ResourceDestructionResult.objects.create(
        item=item1,
        resource_type="zaken",
        metadata={
            "url": "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            "omschrijving": "Test description 1",
            "identificatie": "ZAAK-01",
            "startdatum": "2020-01-01",
            "einddatum": "2022-01-01",
            "resultaat": "http://zaken.nl/api/v1/resultaten/111-111-111",
            "zaaktype": {
                "url": "http://catalogi.nl/api/v1/zaaktypen/111-111-111",
                "omschrijving": "Tralala zaaktype",
                "selectielijst_procestype": {
                    "nummer": 1,
                },
            },
        },
        url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        status=ResourceDestructionResultStatus.deleted,
    )
    item2 = DestructionListItemFactory.create(
        processing_status=InternalStatus.succeeded,
        destruction_list=destruction_list,
    )
    ResourceDestructionResult.objects.create(
        item=item2,
        resource_type="zaken",
        metadata={
            "url": "http://localhost:8003/zaken/api/v1/zaken/222-222-222",
            "omschrijving": "Test description 1",
            "identificatie": "ZAAK-01",
            "startdatum": "2020-01-01",
            "einddatum": "2022-01-01",
            "resultaat": "http://zaken.nl/api/v1/resultaten/222-222-222",
            "zaaktype": {
                "url": "http://catalogi.nl/api/v1/zaaktypen/222-222-222",
                "omschrijving": "Tralala zaaktype",
                "selectielijst_procestype": {
                    "nummer": 1,
                },
            },
        },
        url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
        status=ResourceDestructionResultStatus.deleted,
    )

    # ---------- Testing deletion
    with patch(
        "openarchiefbeheer.destruction.tasks.upload_destruction_report_to_openzaak"
    ):
        complete_and_notify(destruction_list.pk)

    assert ResourceDestructionResult.objects.all().count() == 0
    with pytest.raises(FileNotFoundError):
        destruction_list.destruction_report.file  # noqa: B018
    assert not os.path.isfile(path)


@pytest.mark.django_db
def test_destroying_list_with_item_archiefactiedatum_in_future(
    settings: SettingsWrapper, openzaak_reload: None, vcr: Cassette
):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    # ---------- Setting up test data
    ServiceFactory.create(
        api_type=APITypes.zrc,
        slug="zaken",
        label="Open Zaak - Zaken API",
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.drc,
        slug="documenten",
        api_root="http://localhost:8003/documenten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.ztc,
        slug="catalogi",
        api_root="http://localhost:8003/catalogi/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.brc,
        slug="besluiten",
        api_root="http://localhost:8003/besluiten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    helper = OpenZaakDataCreationHelper(
        zrc_service_slug="zaken",
        ztc_service_slug="catalogi",
        drc_service_slug="documents",
    )
    resources = helper.create_zaaktype_with_relations(
        omschrijving="Test OAB zaaktype",
        identificatie="ZAAKTYPE-2018-0000000001",
        selectielijst_procestype="https://selectielijst.openzaak.nl/api/v1/procestypen/aa8aa2fd-b9c6-4e34-9a6c-58a677f60ea0",
    )
    helper.publish_zaaktype(resources["zaaktype"]["url"])
    zaak1 = helper.create_zaak(
        zaaktype_url=resources["zaaktype"]["url"],
        startdatum="2020-01-01",
        archiefactiedatum="2025-01-01",
    )
    helper.close_zaak(
        zaak_url=zaak1["url"],
        resultaattype_url=resources["resultaattype"]["url"],
        statustype_url=resources["statustypen"][1]["url"],
        toelichting="Closing zaak.",
    )
    zaak2 = helper.create_zaak(
        zaaktype_url=resources["zaaktype"]["url"],
        startdatum="2020-01-01",
        archiefactiedatum="2023-01-01",
    )
    helper.close_zaak(
        zaak_url=zaak2["url"],
        resultaattype_url=resources["resultaattype"]["url"],
        statustype_url=resources["statustypen"][1]["url"],
        toelichting="Closing zaak.",
    )

    with freeze_time("2026-01-22"):
        resync_zaken()

    destruction_list = DestructionListFactory.create(
        name="A test list",
        status=ListStatus.ready_to_delete,
    )
    item1 = DestructionListItemFactory.create(
        zaak=Zaak.objects.get(identificatie=zaak1["identificatie"]),
        destruction_list=destruction_list,
    )
    item2 = DestructionListItemFactory.create(
        zaak=Zaak.objects.get(identificatie=zaak2["identificatie"]),
        destruction_list=destruction_list,
    )

    with (
        freeze_time("2024-01-01"),
    ):
        delete_destruction_list(destruction_list)

    destruction_list.refresh_from_db()

    assert destruction_list.processing_status == InternalStatus.failed
    assert destruction_list.status == ListStatus.ready_to_delete

    item1.refresh_from_db()
    item2.refresh_from_db()

    assert item1.processing_status == InternalStatus.failed
    assert item2.processing_status == InternalStatus.succeeded
    assert item1._zaak_url == zaak1["url"]
    assert item2._zaak_url == ""
    assert Zaak.objects.filter(identificatie=zaak1["identificatie"]).exists()
    assert not Zaak.objects.filter(identificatie=zaak2["identificatie"]).exists()


@pytest.mark.django_db
def test_destroy_list(settings: SettingsWrapper, openzaak_reload: None, vcr: Cassette):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    # ---------- Setting up test data
    ServiceFactory.create(
        api_type=APITypes.zrc,
        slug="zaken",
        label="Open Zaak - Zaken API",
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.drc,
        slug="documenten",
        api_root="http://localhost:8003/documenten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.ztc,
        slug="catalogi",
        api_root="http://localhost:8003/catalogi/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.brc,
        slug="besluiten",
        api_root="http://localhost:8003/besluiten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    APIConfigFactory.create()
    helper = OpenZaakDataCreationHelper(
        zrc_service_slug="zaken",
        ztc_service_slug="catalogi",
        drc_service_slug="documents",
    )
    resources = helper.create_zaaktype_with_relations(
        omschrijving="Test OAB zaaktype",
        identificatie="ZAAKTYPE-2018-0000000001",
        selectielijst_procestype="https://selectielijst.openzaak.nl/api/v1/procestypen/aa8aa2fd-b9c6-4e34-9a6c-58a677f60ea0",
    )
    helper.publish_zaaktype(resources["zaaktype"]["url"])
    zaak1 = helper.create_zaak(
        zaaktype_url=resources["zaaktype"]["url"],
        startdatum="2020-01-01",
        archiefactiedatum="2023-01-01",
    )
    helper.close_zaak(
        zaak_url=zaak1["url"],
        resultaattype_url=resources["resultaattype"]["url"],
        statustype_url=resources["statustypen"][1]["url"],
        toelichting="Closing zaak.",
    )
    zaak2 = helper.create_zaak(
        zaaktype_url=resources["zaaktype"]["url"],
        startdatum="2020-01-01",
        archiefactiedatum="2023-01-01",
    )
    helper.close_zaak(
        zaak_url=zaak2["url"],
        resultaattype_url=resources["resultaattype"]["url"],
        statustype_url=resources["statustypen"][1]["url"],
        toelichting="Closing zaak.",
    )

    with freeze_time("2026-01-22"):
        resync_zaken()

    destruction_list = DestructionListFactory.create(
        name="A test list",
        status=ListStatus.ready_to_delete,
    )
    item1 = DestructionListItemFactory.create(
        zaak=Zaak.objects.get(identificatie=zaak1["identificatie"]),
        destruction_list=destruction_list,
    )
    item2 = DestructionListItemFactory.create(
        zaak=Zaak.objects.get(identificatie=zaak2["identificatie"]),
        destruction_list=destruction_list,
    )

    # ---------- Testing deletion
    with (
        patch(
            "openarchiefbeheer.destruction.tasks.upload_destruction_report_to_openzaak"
        ),
    ):
        delete_destruction_list(destruction_list)

    destruction_list.refresh_from_db()

    assert destruction_list.processing_status == InternalStatus.succeeded
    assert destruction_list.status == ListStatus.deleted

    item1.refresh_from_db()
    item2.refresh_from_db()

    assert item1.processing_status == InternalStatus.succeeded
    assert item2.processing_status == InternalStatus.succeeded
    assert item1._zaak_url == ""
    assert item2._zaak_url == ""
    assert not Zaak.objects.filter(identificatie=zaak1["identificatie"]).exists()
    assert not Zaak.objects.filter(identificatie=zaak2["identificatie"]).exists()

    assert ResourceDestructionResult.objects.all().count() == 0

    with pytest.raises(ValueError):
        destruction_list.destruction_report.file  # noqa: B018


@pytest.mark.django_db
def test_retry_destroying_list_with_previously_failed_item(
    settings: SettingsWrapper, openzaak_reload: None, vcr: Cassette
):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    # ---------- Setting up test data
    ServiceFactory.create(
        api_type=APITypes.zrc,
        slug="zaken",
        label="Open Zaak - Zaken API",
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.drc,
        slug="documenten",
        api_root="http://localhost:8003/documenten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.ztc,
        slug="catalogi",
        api_root="http://localhost:8003/catalogi/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.brc,
        slug="besluiten",
        api_root="http://localhost:8003/besluiten/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    APIConfigFactory.create()
    helper = OpenZaakDataCreationHelper(
        zrc_service_slug="zaken",
        ztc_service_slug="catalogi",
        drc_service_slug="documents",
    )
    resources = helper.create_zaaktype_with_relations(
        omschrijving="Test OAB zaaktype",
        identificatie="ZAAKTYPE-2018-0000000001",
        selectielijst_procestype="https://selectielijst.openzaak.nl/api/v1/procestypen/aa8aa2fd-b9c6-4e34-9a6c-58a677f60ea0",
    )
    helper.publish_zaaktype(resources["zaaktype"]["url"])
    zaak = helper.create_zaak(
        zaaktype_url=resources["zaaktype"]["url"],
        startdatum="2020-01-01",
        archiefactiedatum="2023-01-01",
    )
    helper.close_zaak(
        zaak_url=zaak["url"],
        resultaattype_url=resources["resultaattype"]["url"],
        statustype_url=resources["statustypen"][1]["url"],
        toelichting="Closing zaak.",
    )

    with freeze_time("2026-01-22"):
        resync_zaken()

    author = UserFactory.create(post__can_start_destruction=True)
    destruction_list = DestructionListFactory.create(
        status=ListStatus.ready_to_delete,
        processing_status=InternalStatus.failed,
        author=author,
    )
    logevent.destruction_list_deletion_triggered(destruction_list, author)

    DestructionListItemFactory.create(
        with_zaak=True,
        zaak=Zaak.objects.get(identificatie=zaak["identificatie"]),
        destruction_list=destruction_list,
        processing_status=InternalStatus.failed,
    )

    with (
        patch(
            "openarchiefbeheer.destruction.tasks.upload_destruction_report_to_openzaak"
        ) as m,
    ):
        delete_destruction_list(destruction_list)

    destruction_list.refresh_from_db()

    assert destruction_list.processing_status == InternalStatus.succeeded
    assert destruction_list.status == ListStatus.deleted

    item = destruction_list.items.first()

    assert item.processing_status == InternalStatus.succeeded
    assert not ResourceDestructionResult.objects.filter(item=item).exists()
    m.assert_called()

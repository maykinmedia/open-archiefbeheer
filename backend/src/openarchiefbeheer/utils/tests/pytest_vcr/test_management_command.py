from io import StringIO

from django.core.management import call_command

import pytest
from freezegun import freeze_time
from vcr.cassette import Cassette
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from openarchiefbeheer.config.models import APIConfig, ArchiveConfig
from openarchiefbeheer.external_registers.registry import register as registry
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tasks import resync_zaken

EXPECTED_SERVICES = [
    {
        "api_root": "http://localhost:8003/catalogi/api/v1/",
        "label": "Catalogi API",
        "slug": "catalogi",
        "api_type": APITypes.ztc,
    },
    {
        "api_root": "http://localhost:8003/zaken/api/v1/",
        "label": "Zaken API",
        "slug": "zaken",
        "api_type": APITypes.zrc,
    },
    {
        "api_root": "http://localhost:8003/besluiten/api/v1/",
        "label": "Besluiten API",
        "slug": "besluiten",
        "api_type": APITypes.brc,
    },
    {
        "api_root": "http://localhost:8003/documenten/api/v1/",
        "label": "Documenten API",
        "slug": "documenten",
        "api_type": APITypes.drc,
    },
    {
        "api_root": "https://selectielijst.openzaak.nl/api/v1/",
        "label": "Selectielijst API",
        "slug": "selectielijst",
        "api_type": APITypes.orc,
    },
    {
        "api_root": "http://localhost:8006/api/v2/",
        "label": "Objecten API",
        "slug": "objecten",
        "api_type": APITypes.orc,
    },
    {
        "api_root": "http://localhost:8005/klantinteracties/api/v1/",
        "label": "Klantinteracties API (Open Klant)",
        "slug": "openklant",
        "api_type": APITypes.orc,
    },
]


@pytest.mark.django_db
def test_demo_data_command(openzaak_reload: None, vcr: Cassette) -> None:
    call_command(
        "create_demo_data",
        stdout=StringIO(),
    )

    with freeze_time("2026-01-16"):
        resync_zaken()

    # check services
    for expected_service in EXPECTED_SERVICES:
        services = Service.objects.filter(api_root=expected_service["api_root"])

        assert services.count() == 1
        service = services.get()

        assert service.label == expected_service["label"]
        assert service.slug == expected_service["slug"]
        assert service.api_type == expected_service["api_type"]

    # check zaken
    assert Zaak.objects.count() == 5

    # check configs are not updated
    api_config = APIConfig.get_solo()
    assert not api_config.selectielijst_api_service

    archive_config = ArchiveConfig.get_solo()
    assert not archive_config.bronorganisatie
    assert not archive_config.zaaktype
    assert not archive_config.statustype
    assert not archive_config.resultaattype
    assert not archive_config.informatieobjecttype

    for _, plugin in registry.iterate():
        config = plugin.get_or_create_config()
        assert not config.services.all()


@pytest.mark.django_db
def test_demo_data_command_with_config_update(
    openzaak_reload: None, vcr: Cassette
) -> None:
    call_command(
        "create_demo_data",
        "--update-config",
        stdout=StringIO(),
    )

    with freeze_time("2026-08-13"):
        resync_zaken()

    # check services
    for expected_service in EXPECTED_SERVICES:
        services = Service.objects.filter(api_root=expected_service["api_root"])

        assert services.count() == 1
        service = services.get()

        assert service.label == expected_service["label"]
        assert service.slug == expected_service["slug"]
        assert service.api_type == expected_service["api_type"]

    # check zaken
    assert Zaak.objects.count() == 5

    # check configs are not updated
    api_config = APIConfig.get_solo()
    assert api_config.selectielijst_api_service
    assert (
        api_config.selectielijst_api_service.api_root
        == "https://selectielijst.openzaak.nl/api/v1/"
    )

    archive_config = ArchiveConfig.get_solo()
    assert archive_config.bronorganisatie == "100000009"
    assert archive_config.zaaktype
    assert archive_config.statustype
    assert archive_config.resultaattype
    assert archive_config.informatieobjecttype

    for _, plugin in registry.iterate():
        config = plugin.get_or_create_config()
        assert config.services.exists()

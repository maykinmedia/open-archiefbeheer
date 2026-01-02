import pytest
from freezegun import freeze_time
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.tests.factories import APIConfigFactory

from ...api.serializers import ZaakMetadataSerializer
from ...models import Zaak
from ...tasks import retrieve_and_cache_zaken_from_openzaak


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["resultaattype_and_rollen.json"])
def test_zaak_serializer_selectielijstklasse_derived(openzaak_reload: None, vcr: None):
    APIConfigFactory.create()
    ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    ServiceFactory.create(
        api_type=APITypes.ztc,
        api_root="http://localhost:8003/catalogi/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )

    with freeze_time("2024-08-29T16:00:00+02:00"):
        retrieve_and_cache_zaken_from_openzaak()

    zaak = Zaak.objects.get(identificatie="ZAAK-2025-02-20-B")

    assert zaak.selectielijstklasse == ""

    serialiser = ZaakMetadataSerializer(instance=zaak)

    assert (
        serialiser.data["selectielijstklasse"]
        == "1.1 - Ingericht - vernietigen - P10Y (2017)"
    )

    assert serialiser.data["selectielijstklasse_versie"] == "2017"

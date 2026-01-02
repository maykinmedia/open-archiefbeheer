import pytest
from freezegun import freeze_time
from requests_mock import Mocker
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ...models import Zaak
from ...tasks import retrieve_and_cache_zaken_from_openzaak


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["zaken.json"])
def test_recaching_zaken_with_multiple_pages_doesnt_explode_url(
    openzaak_reload: None, vcr: None
):
    """Github issue #298"""
    ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )
    with Mocker(real_http=True) as m:
        with freeze_time("2024-08-29T16:00:00+02:00"):
            retrieve_and_cache_zaken_from_openzaak()

        last_call = m.request_history[-1]

        assert (
            last_call.query
            == "archiefnominatie=vernietigen&einddatum__isnull=false&einddatum__lt=2024-08-29&expand=resultaat%2cresultaat.resultaattype%2czaaktype%2crollen&page=2"
        )

    zaken_in_db = Zaak.objects.all()

    assert zaken_in_db.count() == 101


@pytest.mark.django_db
@pytest.mark.openzaak(fixtures=["zaken.json"])
def test_recaching_zaken_correct_eindatum(openzaak_reload: None, vcr: None):
    ServiceFactory.create(
        api_type=APITypes.zrc,
        api_root="http://localhost:8003/zaken/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )

    with freeze_time("2024-08-02T16:00:00+02:00"):
        retrieve_and_cache_zaken_from_openzaak()

    zaken_in_db = Zaak.objects.all()

    assert zaken_in_db.count() == 2

    with freeze_time("2024-08-29T16:00:00+02:00"):
        retrieve_and_cache_zaken_from_openzaak()

    zaken_in_db = Zaak.objects.all()

    assert zaken_in_db.count() == 101

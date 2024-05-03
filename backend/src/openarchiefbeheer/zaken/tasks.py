from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service
from zgw_consumers.utils import pagination_helper

from openarchiefbeheer.celery import app

from .models import Zaak


@app.task
def retrieve_and_cache_zaken_from_openzaak() -> list[Zaak]:
    zrc_service = Service.objects.get(api_type=APITypes.zrc)
    zrc_client = build_client(zrc_service)

    with zrc_client:
        response = zrc_client.get(
            "zaken",
            headers={"Accept-Crs": "EPSG:4326"},
        )
        response.raise_for_status()

        zaken_data = pagination_helper(zrc_client, response.json())

    # Removing existing cached zaken
    Zaak.objects.all().delete()

    cached_zaken = Zaak.objects.bulk_create([Zaak(data=zaak) for zaak in zaken_data])
    return cached_zaken

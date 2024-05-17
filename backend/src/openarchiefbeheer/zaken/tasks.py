from django.db import transaction

from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from openarchiefbeheer.celery import app

from .api.serializers import ZaakSerializer
from .models import Zaak
from .utils import pagination_helper, process_expanded_data


@app.task
def retrieve_and_cache_zaken_from_openzaak() -> None:
    zrc_service = Service.objects.get(api_type=APITypes.zrc)
    zrc_client = build_client(zrc_service)

    with zrc_client:
        response = zrc_client.get(
            "zaken",
            headers={"Accept-Crs": "EPSG:4326"},
            params={"expand": "resultaat,resultaat.resultaattype,zaaktype"},
        )
        response.raise_for_status()

        data_iterator = pagination_helper(
            zrc_client, response.json(), headers={"Accept-Crs": "EPSG:4326"}
        )

    with transaction.atomic():
        # Removing existing cached zaken
        Zaak.objects.all().delete()

        for data in data_iterator:
            zaken = process_expanded_data(data["results"])
            serializer = ZaakSerializer(data=zaken, many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

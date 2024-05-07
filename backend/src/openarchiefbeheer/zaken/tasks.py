from django.db import transaction

from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from openarchiefbeheer.celery import app

from .api.serializers import ZaakSerializer
from .models import Zaak
from .utils import pagination_helper


@app.task
def retrieve_and_cache_zaken_from_openzaak() -> None:
    zrc_service = Service.objects.get(api_type=APITypes.zrc)
    zrc_client = build_client(zrc_service)

    with zrc_client:
        response = zrc_client.get(
            "zaken",
            headers={"Accept-Crs": "EPSG:4326"},
        )
        response.raise_for_status()

        data_iterator = pagination_helper(zrc_client, response.json())

    with transaction.atomic():
        # Removing existing cached zaken
        Zaak.objects.all().delete()

        for data in data_iterator:
            serializer = ZaakSerializer(data=data["results"], many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

import datetime
import logging

from django.conf import settings
from django.db import transaction
from django.db.models import Max

from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from openarchiefbeheer.celery import app
from openarchiefbeheer.config.models import APIConfig
from openarchiefbeheer.destruction.utils import resync_items_and_zaken
from openarchiefbeheer.logging import logevent

from .api.serializers import ZaakSerializer
from .decorators import log_errors
from .models import Zaak
from .utils import NoClient, pagination_helper, process_expanded_data

logger = logging.getLogger(__name__)


@app.task
def retrieve_and_cache_zaken_from_openzaak() -> None:
    zrc_service = Service.objects.get(api_type=APITypes.zrc)
    zrc_client = build_client(zrc_service)

    config = APIConfig.get_solo()
    service = config.selectielijst_api_service
    selectielijst_api_client = build_client(service) if service else None

    today = datetime.date.today()
    query_params = {
        "expand": "resultaat,resultaat.resultaattype,zaaktype,rollen",
        "archiefnominatie": "vernietigen",
        "einddatum__isnull": False,
        "einddatum__lt": today.isoformat(),
    }
    if zaken_in_db := Zaak.objects.exists():
        result = Zaak.objects.aggregate(Max("einddatum"))
        query_params.update({"einddatum__gt": result["einddatum__max"].isoformat()})

    with zrc_client:
        response = zrc_client.get(
            "zaken",
            headers={"Accept-Crs": "EPSG:4326"},
            params=query_params,
            timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
        )
        response.raise_for_status()

        data_iterator = pagination_helper(
            zrc_client,
            response.json(),
            headers={"Accept-Crs": "EPSG:4326"},
            timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
        )

    with selectielijst_api_client or NoClient():
        for index, data in enumerate(data_iterator):
            logger.info("Retrieved page %s.", index + 1)

            zaken = data["results"]
            if selectielijst_api_client:
                zaken = process_expanded_data(zaken, selectielijst_api_client)

            # Since before we indexed also zaken without einddatum, prevent
            # crash when retrieving zaken.
            if zaken_in_db:
                new_zaken = {zaak["url"]: zaak for zaak in zaken}
                duplicates = Zaak.objects.filter(url__in=new_zaken.keys())
                if duplicates.exists():
                    for duplicate in duplicates:
                        del new_zaken[duplicate.url]
                zaken = [zaak for zaak in new_zaken.values()]

            serializer = ZaakSerializer(data=zaken, many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()


@app.task
@log_errors(logevent.resync_failed)
def resync_zaken():
    zrc_service = Service.objects.get(api_type=APITypes.zrc)
    zrc_client = build_client(zrc_service)

    today = datetime.date.today()
    query_params = {
        "expand": "resultaat,resultaat.resultaattype,zaaktype,rollen",
        "archiefnominatie": "vernietigen",
        "einddatum__isnull": False,
        "einddatum__lt": today.isoformat(),
    }

    config = APIConfig.get_solo()
    service = config.selectielijst_api_service
    selectielijst_api_client = build_client(service) if service else None

    logevent.resync_started()
    with transaction.atomic(), zrc_client, selectielijst_api_client or NoClient():
        Zaak.objects.all().delete()

        response = zrc_client.get(
            "zaken",
            headers={"Accept-Crs": "EPSG:4326"},
            params=query_params,
            timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
        )
        response.raise_for_status()

        data_iterator = pagination_helper(
            zrc_client,
            response.json(),
            headers={"Accept-Crs": "EPSG:4326"},
            timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
        )

        for index, data in enumerate(data_iterator):
            logger.info("Retrieved page %s.", index + 1)

            zaken = data["results"]
            if selectielijst_api_client:
                zaken = process_expanded_data(zaken, selectielijst_api_client)

            serializer = ZaakSerializer(data=zaken, many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        # Resync the destruction list items with the zaken
        resync_items_and_zaken()

    logevent.resync_successful()

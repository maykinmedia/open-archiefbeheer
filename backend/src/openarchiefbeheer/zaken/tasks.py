import datetime
import logging

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.db.models import Max

from ape_pie import APIClient
from requests.adapters import HTTPAdapter, Retry

from openarchiefbeheer.celery import app
from openarchiefbeheer.clients import selectielijst_client, zrc_client
from openarchiefbeheer.destruction.utils import resync_items_and_zaken
from openarchiefbeheer.logging import logevent

from .api.serializers import ZaakSerializer
from .decorators import log_errors
from .models import Zaak
from .utils import NoClient, pagination_helper, process_expanded_data

logger = logging.getLogger(__name__)


def configure_retry(client: APIClient) -> APIClient:
    retries = Retry(
        total=settings.RETRY_TOTAL,
        backoff_factor=settings.RETRY_BACKOFF_FACTOR,
        status_forcelist=settings.RETRY_STATUS_FORCELIST,
    )
    client.adapters["http://"] = HTTPAdapter(max_retries=retries)
    client.adapters["https://"] = HTTPAdapter(max_retries=retries)
    return client


def retrieve_and_cache_zaken(is_full_resync=False):
    # TODO: We should probably let this error out,
    # But I don't want to change the behaviour for now while fixing #867
    try:
        selectielijst_api_client = selectielijst_client()
    except ImproperlyConfigured:
        selectielijst_api_client = None

    today = datetime.date.today()
    query_params = {
        "expand": "resultaat,resultaat.resultaattype,zaaktype,rollen",
        "archiefnominatie": "vernietigen",
        "einddatum__isnull": False,
        "einddatum__lt": today.isoformat(),
    }

    if not is_full_resync and Zaak.objects.exists():
        result = Zaak.objects.aggregate(Max("einddatum"))
        query_params.update({"einddatum__gt": result["einddatum__max"].isoformat()})

    client = configure_retry(zrc_client())
    with transaction.atomic(), client, selectielijst_api_client or NoClient():
        if is_full_resync:
            Zaak.objects.all().delete()

        response = client.get(
            "zaken",
            headers={"Accept-Crs": "EPSG:4326"},
            params=query_params,
            timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
        )
        response.raise_for_status()

        data_iterator = pagination_helper(
            client,
            response.json(),
            headers={"Accept-Crs": "EPSG:4326"},
            timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
        )

        for index, data in enumerate(data_iterator):
            logger.info("Retrieved page %s.", index + 1)

            zaken = data["results"]
            if not is_full_resync:
                # Check if we retrieved zaken that are already present in the DB.
                # If yes, we keep the existing version
                new_zaken = {zaak["url"]: zaak for zaak in zaken}
                duplicates = Zaak.objects.filter(url__in=new_zaken.keys())
                if duplicates.exists():
                    for duplicate in duplicates:
                        del new_zaken[duplicate.url]
                zaken = [zaak for zaak in new_zaken.values()]

            if selectielijst_api_client:
                zaken = process_expanded_data(zaken, selectielijst_api_client)

            serializer = ZaakSerializer(data=zaken, many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        if is_full_resync:
            resync_items_and_zaken()


@app.task
def retrieve_and_cache_zaken_from_openzaak() -> None:
    retrieve_and_cache_zaken(is_full_resync=False)


@app.task
@log_errors(logevent.resync_failed)
def resync_zaken():
    logevent.resync_started()

    retrieve_and_cache_zaken(is_full_resync=True)

    logevent.resync_successful()

from functools import lru_cache, partial
from typing import Callable, Generator, Iterable, Literal

from django.conf import settings
from django.core.cache import cache
from django.utils.translation import gettext as _

from ape_pie import APIClient
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.util import underscoreize
from furl import furl
from glom import glom
from requests import HTTPError
from rest_framework import status
from zgw_consumers.api_models.selectielijst import Resultaat
from zgw_consumers.client import build_client
from zgw_consumers.concurrent import parallel
from zgw_consumers.models import Service
from zgw_consumers.utils import PaginatedResponseData

from openarchiefbeheer.clients import brc_client, drc_client, zrc_client, ztc_client
from openarchiefbeheer.config.exceptions import ServiceNotConfigured
from openarchiefbeheer.config.models import APIConfig
from openarchiefbeheer.utils.datastructure import HashableDict
from openarchiefbeheer.utils.results_store import ResultStore

from .models import Zaak
from .types import DropDownChoice


def pagination_helper(
    client: APIClient, paginated_response: PaginatedResponseData, **kwargs
) -> Generator[PaginatedResponseData, None, None]:
    def _iter(
        _data: PaginatedResponseData,
    ) -> Generator[PaginatedResponseData, None, None]:
        yield underscoreize(_data, **CamelCaseJSONParser.json_underscoreize)

        if next_url := _data.get("next"):
            response = client.get(next_url, **kwargs)
            response.raise_for_status()
            data = response.json()

            yield from _iter(data)

    return _iter(paginated_response)


@lru_cache
def get_resource(url: str) -> dict | None:
    service = Service.get_service(url)
    if not service:
        return

    client = build_client(service)
    with client:
        response = client.get(
            url,
            timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

    return data


def get_resource_with_prebuilt_client(client: APIClient, url: str) -> dict | None:
    response = client.get(
        url,
        timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()

    return data


def process_expanded_data(
    zaken: list[dict], selectielijst_api_client: APIClient
) -> list[dict]:
    def expand_procestype(retrieved_procestypen: dict, zaak: dict) -> dict:
        if "_expand" not in zaak:
            return zaak

        extra_data = zaak["_expand"]
        if procestype_url := extra_data["zaaktype"].get("selectielijst_procestype"):
            if (
                expanded_procestype := retrieved_procestypen.get(procestype_url)
            ) is not None:
                extra_data["zaaktype"]["selectielijst_procestype"] = expanded_procestype

        return zaak

    procestypen_urls = set(
        [
            glom(zaak, "_expand.zaaktype.selectielijst_procestype")
            for zaak in zaken
            if glom(zaak, "_expand.zaaktype.selectielijst_procestype", default=None)
        ]
    )
    retrieve_procestype_fn = partial(
        get_resource_with_prebuilt_client, selectielijst_api_client
    )

    with parallel() as executor:
        procestypen = list(executor.map(retrieve_procestype_fn, procestypen_urls))
        expand_procestype_fn = partial(
            expand_procestype,
            {procestype["url"]: procestype for procestype in procestypen},
        )

        processed_zaken = list(executor.map(expand_procestype_fn, zaken))

    return processed_zaken


def format_zaaktype_choices(zaaktypen: Iterable[dict]) -> list[DropDownChoice]:
    formatted_zaaktypen = []
    for zaaktype in zaaktypen:
        omschrijving = zaaktype["omschrijving"]
        label = (
            f"{omschrijving} ({zaaktype.get("identificatie") or _("no identificatie")})"
        )
        formatted_zaaktypen.append(
            {"label": label, "value": zaaktype.get("identificatie") or ""}
        )
    formatted_zaaktypen = sorted(formatted_zaaktypen, key=lambda x: x["label"])
    return formatted_zaaktypen


def format_selectielijstklasse_choice(
    resultaat: Resultaat, procestypen: dict
) -> DropDownChoice:
    description = f"{resultaat.get('volledig_nummer', resultaat['nummer'])} - {resultaat['naam']} - {resultaat['waardering']}"
    if resultaat.get("bewaartermijn"):
        description = description + f" - {resultaat['bewaartermijn']}"

    selectielijstjaar = procestypen[resultaat["proces_type"]]["jaar"]
    description += f" ({selectielijstjaar})"

    return {
        "label": description,
        "value": resultaat["url"],
        "extra_data": {
            "bewaartermijn": resultaat.get("bewaartermijn"),
        },
    }


def format_resultaten_choices(resultaten: list[dict | None]) -> DropDownChoice:
    result = [
        {
            "value": resultaat["_expand"]["resultaattype"]["url"],
            "label": resultaat["_expand"]["resultaattype"]["omschrijving"],
            "extra_data": {"toelichting": resultaat.get("toelichting")},
        }
        for resultaat in resultaten
        if resultaat
    ]
    return result


@lru_cache
def retrieve_selectielijstklasse_choices(
    query_params: HashableDict | None = None,
) -> list:
    config = APIConfig.get_solo()
    selectielijst_service = config.selectielijst_api_service
    if not selectielijst_service:
        return []

    def _retrieve_processtypen(client: APIClient) -> list[dict]:
        response = client.get("procestypen")
        response.raise_for_status()

        return response.json()

    client = build_client(selectielijst_service)
    with client:
        response = client.get("resultaten", params=query_params)
        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

        procestypen = {
            procestype["url"]: procestype
            for procestype in _retrieve_processtypen(client)
        }

        results = []
        for page in data_iterator:
            results += [
                format_selectielijstklasse_choice(result, procestypen)
                for result in page["results"]
            ]

    return results


def get_selectielijstklasse_choices_dict() -> dict[str, DropDownChoice]:
    if selectielijstklasse_dict := cache.get("selectielijstklasse_choices_dict"):
        return selectielijstklasse_dict

    results = retrieve_selectielijstklasse_choices()
    results = {result["value"]: result for result in results}
    cache.set("selectielijstklasse_choices_dict", results)
    return results


@lru_cache
def get_all_selectielijst_resultaten() -> list[dict]:
    config = APIConfig.get_solo()
    selectielijst_service = config.selectielijst_api_service
    if not selectielijst_service:
        return []

    client = build_client(selectielijst_service)
    with client:
        response = client.get("resultaten")
        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

        results = []
        for page in data_iterator:
            results += page["results"]
        return results


@lru_cache
def get_all_selectielijst_procestypen() -> list[dict]:
    config = APIConfig.get_solo()
    selectielijst_service = config.selectielijst_api_service
    if not selectielijst_service:
        return []

    client = build_client(selectielijst_service)
    with client:
        response = client.get("procestypen")
        response.raise_for_status()
    return response.json()


def get_selectielijstprocestypen_dict() -> dict[str, dict]:
    if selectielijstprocestypen_dict := cache.get("selectielijstprocestypen_dict"):
        return selectielijstprocestypen_dict

    procestypen = get_all_selectielijst_procestypen()
    result = {item["url"]: item for item in procestypen}
    cache.set("selectielijstprocestypen_dict", result)
    return result


def get_selectielijstresultaten_dict() -> dict[str, dict]:
    if selectielijstresultaten_dict := cache.get("selectielijstresultaten_dict"):
        return selectielijstresultaten_dict

    resultaten = get_all_selectielijst_resultaten()
    result = {item["url"]: item for item in resultaten}
    cache.set("selectielijstresultaten_dict", result)
    return result


@lru_cache
def retrieve_selectielijstklasse_resultaat(resultaat_url: str) -> dict:
    config = APIConfig.get_solo()
    selectielijst_service = config.selectielijst_api_service
    if not selectielijst_service:
        raise ServiceNotConfigured(msg="No selectielijst API service configured.")

    client = build_client(selectielijst_service)
    with client:
        response = client.get(resultaat_url)
        response.raise_for_status()

    return response.json()


def delete_object_and_store_result(
    store: ResultStore,
    resource_type: str,
    resource: str,
    callable: Callable,
    http_error_handler: Callable | None = None,
) -> None:
    try:
        response = callable(timeout=settings.REQUESTS_DEFAULT_TIMEOUT)
        if response.status_code == status.HTTP_404_NOT_FOUND:
            # Could not be found, nothing to delete
            return
        response.raise_for_status()
    except HTTPError as exc:
        if http_error_handler:
            return http_error_handler(exc)
        raise exc

    store.add_deleted_resource(resource_type, resource)
    store.save()


def handle_delete_with_pending_relations(exc: HTTPError) -> None:
    response = exc.response
    has_pending_relations = (
        response.status_code == status.HTTP_400_BAD_REQUEST
        and response.json()["invalidParams"][0]["code"] == "pending-relations"
    )
    if (
        not response.status_code == status.HTTP_204_NO_CONTENT
        and not has_pending_relations
    ):
        response.raise_for_status()


def delete_decisions_and_relation_objects(
    zaak: "Zaak", result_store: ResultStore
) -> None:
    """Delete decisions related to the zaak and besluiten informatie objecten.

    This automatically deletes ZaakBesluiten in the Zaken API.
    """
    with brc_client() as client:
        response = client.get("besluiten", params={"zaak": zaak.url})
        response.raise_for_status()

        data = response.json()
        if data["count"] == 0:
            return

        data_iterator = pagination_helper(
            client,
            data,
            params={"zaak": zaak.url},
        )

        for data in data_iterator:
            for besluit in data["results"]:
                besluit_uuid = furl(besluit["url"]).path.segments[-1]
                delete_relation_object(client, "besluit", besluit["url"], result_store)

                delete_object_and_store_result(
                    result_store,
                    "besluiten",
                    besluit["url"],
                    partial(client.delete, f"besluiten/{besluit_uuid}"),
                    handle_delete_with_pending_relations,
                )


def delete_relation_object(
    client: APIClient,
    object_type: Literal["zaak", "besluit"],
    object_url: str,
    result_store: ResultStore,
) -> None:
    """Delete zaak informatie objecten or besluit informatie objecten.

    Store the URLs of the documents that should be deleted."""
    relation_object_name = (
        "zaakinformatieobjecten"
        if object_type == "zaak"
        else "besluitinformatieobjecten"
    )

    response = client.get(relation_object_name, params={object_type: object_url})
    response.raise_for_status()

    # The ZIOs or the BIOs
    relation_objects = response.json()

    if not len(relation_objects):
        return

    for relation_object in relation_objects:
        result_store.add_resource_to_delete(
            "enkelvoudiginformatieobjecten", relation_object["informatieobject"]
        )
        relation_object_uuid = furl(relation_object["url"]).path.segments[-1]
        delete_object_and_store_result(
            result_store,
            relation_object_name,
            relation_object["url"],
            partial(client.delete, f"{relation_object_name}/{relation_object_uuid}"),
        )


def delete_documents(result_store: ResultStore) -> None:
    with drc_client() as client:
        for document_url in result_store.get_resources_to_delete(
            "enkelvoudiginformatieobjecten"
        ):
            document_uuid = furl(document_url).path.segments[-1]
            delete_object_and_store_result(
                result_store,
                "enkelvoudiginformatieobjecten",
                document_url,
                partial(
                    client.delete, f"enkelvoudiginformatieobjecten/{document_uuid}"
                ),
                handle_delete_with_pending_relations,
            )

    result_store.clear_resources_to_delete("enkelvoudiginformatieobjecten")


def delete_zaak(zaak: "Zaak", zrc_client: APIClient, result_store: ResultStore) -> None:
    with zrc_client:
        delete_object_and_store_result(
            result_store,
            "zaken",
            zaak.url,
            partial(zrc_client.delete, f"zaken/{zaak.uuid}"),
        )


def delete_zaak_and_related_objects(zaak: "Zaak", result_store: ResultStore) -> None:
    """Delete a zaak and related objects

    The procedure to delete all objects related to a zaak is as follows:
    - Check if there are besluiten (in the Besluiten API) related to the zaak.
    - Check if there are documents related to these besluiten (BesluitenInformatieObjecten).
      If yes, store the URLs of the corresponding documents.
    - Delete the BIOs.
    - Delete the besluiten related to the zaak. This automatically deletes ZaakBesluiten in the Zaken API.
      If the besluiten are still related to other objects, this will raise a 400 error.
    - Check if there are ZaakInformatieOjecten. If yes, store the URLs of the corresponding documents.
    - Delete the ZIOs, which automatically deletes the corresponding OIOs.
    - Delete the documents (that were related to both the zaak and to the besluiten that were related to the zaak).
      If the documents are still related to other objects, this will raise a 400 error.
    - Delete the zaak.

    The result store keeps track of which objects have been deleted from the
    external API. In case of a retry after an error, no calls are made for
    resources that have already been deleted.

    The store also keeps track of any document that needs to be deleted.
    If an error occurs after deleting the ZIOs, we wouldn't know which documents
    should be deleted.
    """
    client = zrc_client()

    delete_decisions_and_relation_objects(zaak, result_store)
    delete_relation_object(client, "zaak", zaak.url, result_store)
    delete_documents(result_store)
    delete_zaak(zaak, client, result_store)


@lru_cache
def retrieve_paginated_type(
    resource_path: str, query_params: HashableDict | None = None
) -> list[DropDownChoice]:
    def format_choice(item: dict) -> DropDownChoice:
        return {"label": item["omschrijving"] or item["url"], "value": item["url"]}

    with ztc_client() as client:
        response = client.get(resource_path, params=query_params)
        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

    results = []
    for page in data_iterator:
        results += [format_choice(result) for result in page["results"]]

    return results


def get_zaak_metadata(zaak: Zaak) -> dict:
    from .api.serializers import ZaakMetadataSerializer

    serializer = ZaakMetadataSerializer(instance=zaak)
    return serializer.data


@lru_cache
def retrieve_zaaktypen(query_params: HashableDict | None = None) -> list[dict]:
    with ztc_client() as client:
        response = client.get("zaaktypen", params=query_params)
        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

    results = []
    for page in data_iterator:
        results += page["results"]

    return results


class NoClient:
    def __enter__(self):
        return None

    def __exit__(self, *args):
        return None


@lru_cache
def get_zaaktype(identificatie: str) -> dict:
    """Get the latest version of the zaaktype with this identificatie"""
    params = HashableDict({"identificatie": identificatie})
    zaaktypen = retrieve_zaaktypen(params)

    zaaktypen = sorted(
        zaaktypen, key=lambda zaaktype: zaaktype["begin_geldigheid"], reverse=True
    )
    return zaaktypen[0]

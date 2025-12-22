from collections import defaultdict
from collections.abc import Container
from functools import partial
from typing import Generator, Iterable, Literal

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import gettext as _

from ape_pie import APIClient
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.util import underscoreize
from furl import furl
from glom import glom
from requests import HTTPError
from rest_framework import status
from zgw_consumers.api_models.selectielijst import Resultaat
from zgw_consumers.api_models.zaken import ZaakObject
from zgw_consumers.client import build_client
from zgw_consumers.concurrent import parallel
from zgw_consumers.utils import PaginatedResponseData

from openarchiefbeheer.clients import (
    _cached,
    _cached_with_args,
    brc_client,
    drc_client,
    get_service_from_url,
    selectielijst_client,
    zrc_client,
    ztc_client,
)
from openarchiefbeheer.external_registers.registry import register as registry
from openarchiefbeheer.types import JSONValue
from openarchiefbeheer.utils.datastructure import HashableDict
from openarchiefbeheer.utils.results_store import (
    ResultStore,
    delete_object_and_store_result,
)

from ..external_registers.utils import get_plugin_for_related_object
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


@_cached_with_args
def get_resource(url: str) -> JSONValue | None:
    service = get_service_from_url(url)
    if not service:
        return

    client = build_client(service)
    with client:
        response = client.get(
            url,
            timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()


def get_resource_with_prebuilt_client(client: APIClient, url: str) -> dict | None:
    response = client.get(
        url,
        timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()

    return data


@_cached_with_args
def fetch_supported_zaakobjects(zaak_url: str) -> list[ZaakObject]:
    """
    Fetches and returns the list of supported related objects for a given Zaak.

    This method retrieves all related objects for the specified Zaak using a ZRC client,
    filters the results to include only those objects that are supported by available plugins,
    and returns the filtered list.

    Args:
        zaak_url: A string representing the URL of the Zaak whose related objects are to be fetched.

    Returns:
        A list of ZaakObject instances representing the supported related objects for the given Zaak.
    """
    zaakobjects = fetch_zaakobjects(zaak_url)
    return [
        zaakobject
        for zaakobject in zaakobjects
        if get_plugin_for_related_object(zaakobject["object"])
    ]


@_cached_with_args
def fetch_zaakobjects(zaak_url: str) -> list[ZaakObject]:
    zaakobjects = []

    with zrc_client() as client:
        response = client.get("zaakobjecten", params={"zaak": zaak_url})

        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

        for page in data_iterator:
            zaakobjects.extend(zaakobject for zaakobject in page["results"])

    return zaakobjects


def process_expanded_data(
    zaken: list[dict], selectielijst_api_client: APIClient
) -> list[dict]:
    def expand_procestype(retrieved_procestypen: dict, zaak: dict) -> dict:
        if "_expand" not in zaak:
            return zaak

        extra_data = zaak["_expand"]
        if (
            procestype_url := extra_data["zaaktype"].get("selectielijst_procestype")
        ) and (
            expanded_procestype := retrieved_procestypen.get(procestype_url)
        ) is not None:
            extra_data["zaaktype"]["selectielijst_procestype"] = expanded_procestype

        return zaak

    procestypen_urls = {
        glom(zaak, "_expand.zaaktype.selectielijst_procestype")
        for zaak in zaken
        if glom(zaak, "_expand.zaaktype.selectielijst_procestype", default=None)
    }
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
            f"{omschrijving} ({zaaktype.get('identificatie') or _('no identificatie')})"
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


@_cached_with_args
def retrieve_selectielijstklasse_choices(
    procestype_url: str = "",
) -> list[DropDownChoice]:
    try:
        client = selectielijst_client()
    except ImproperlyConfigured:
        return []

    with client:
        query_params = {"procesType": procestype_url} if procestype_url else {}
        response = client.get("resultaten", params=query_params)
        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

        @_cached
        def _retrieve_processtypen() -> list[dict]:
            response = client.get("procestypen")
            response.raise_for_status()
            return response.json()

        procestypen = {
            procestype["url"]: procestype for procestype in _retrieve_processtypen()
        }

        results = []
        for page in data_iterator:
            results += [
                format_selectielijstklasse_choice(result, procestypen)
                for result in page["results"]
            ]
    return results


@_cached
def get_selectielijstklasse_choices_dict() -> dict[str, DropDownChoice]:
    results = retrieve_selectielijstklasse_choices()
    return {result["value"]: result for result in results}


@_cached
def get_all_selectielijst_resultaten() -> list[dict]:
    try:
        client = selectielijst_client()
    except ImproperlyConfigured:
        return []

    with client:
        response = client.get("resultaten")
        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

        results = []
        for page in data_iterator:
            results += page["results"]
        return results


@_cached
def get_all_selectielijst_procestypen() -> list[dict]:
    try:
        client = selectielijst_client()
    except ImproperlyConfigured:
        return []

    with client:
        response = client.get("procestypen")
        response.raise_for_status()
    return response.json()


@_cached
def get_selectielijstprocestypen_dict() -> dict[str, JSONValue]:
    procestypen = get_all_selectielijst_procestypen()
    return {item["url"]: item for item in procestypen}


@_cached
def get_selectielijstresultaten_dict() -> dict[str, JSONValue]:
    resultaten = get_all_selectielijst_resultaten()
    return {item["url"]: item for item in resultaten}


@_cached_with_args
def retrieve_selectielijstklasse_resultaat(resultaat_url: str) -> JSONValue:
    client = selectielijst_client()

    with client:
        response = client.get(resultaat_url)
        response.raise_for_status()

    return response.json()


def handle_delete_with_pending_relations(exc: HTTPError) -> None:
    response = exc.response
    has_pending_relations = (
        response.status_code == status.HTTP_400_BAD_REQUEST
        and response.json()["invalidParams"][0]["code"] == "pending-relations"
    )
    if response.status_code != status.HTTP_204_NO_CONTENT and not has_pending_relations:
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


def delete_external_relations(
    zaak_url: str,
    zrc_client: APIClient,
    excluded_relations: Container[str],
    result_store: ResultStore,
) -> None:
    """Delete relations to a zaak in supported external registers."""
    with zrc_client:
        response = zrc_client.get("zaakobjecten", params={"zaak": zaak_url})
        response.raise_for_status()

        related_objects_to_delete = defaultdict(list)
        for page in pagination_helper(zrc_client, response.json()):
            for zaakobject in page["results"]:
                if zaakobject["url"] in excluded_relations:
                    continue

                if plugin := get_plugin_for_related_object(zaakobject["object"]):
                    related_objects_to_delete[plugin.identifier].append(
                        zaakobject["object"]
                    )

    for plugin_identifier in related_objects_to_delete:
        plugin = registry[plugin_identifier]
        plugin.delete_related_resources(
            zaak_url=zaak_url,
            related_resources=related_objects_to_delete[plugin_identifier],
            result_store=result_store,
        )


def delete_zaak_and_related_objects(
    zaak: "Zaak", excluded_relations: Container[str], result_store: ResultStore
) -> None:
    """Delete a zaak and related objects

    The procedure to delete all objects related to a zaak (in Open Zaak) is as follows:
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

    delete_external_relations(zaak.url, client, excluded_relations, result_store)
    delete_decisions_and_relation_objects(zaak, result_store)
    delete_relation_object(client, "zaak", zaak.url, result_store)
    delete_documents(result_store)
    delete_zaak(zaak, client, result_store)


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


@_cached_with_args
def retrieve_zaaktypen(zaaktype_identificatie: str = "") -> list[dict]:
    with ztc_client() as client:
        query_params = (
            {"identificatie": zaaktype_identificatie} if zaaktype_identificatie else {}
        )
        response = client.get("zaaktypen", params=query_params)
        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

    results = []
    for page in data_iterator:
        results += page["results"]

    if zaaktype_identificatie:
        # If the identificatie was provided, sort by begin geldigheid so that the
        # latest version is first.
        results = sorted(
            results, key=lambda zaaktype: zaaktype["begin_geldigheid"], reverse=True
        )

    return results

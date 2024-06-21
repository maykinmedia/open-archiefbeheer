from functools import lru_cache
from typing import Generator

from django.utils.translation import gettext_lazy as _

from ape_pie import APIClient
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.util import underscoreize
from zgw_consumers.api_models.selectielijst import Resultaat
from zgw_consumers.client import build_client
from zgw_consumers.concurrent import parallel
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service
from zgw_consumers.utils import PaginatedResponseData

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
def get_procestype(url: str) -> dict | None:
    service = Service.get_service(url)
    if not service:
        return

    client = build_client(service)
    with client:
        response = client.get(url)
        response.raise_for_status()
        data = response.json()

    return data


def process_expanded_data(zaken: list[dict]) -> list[dict]:
    def expand_procestype(zaak: dict) -> dict:
        if "_expand" not in zaak:
            return zaak

        extra_data = zaak["_expand"]
        if procestype_url := extra_data["zaaktype"].get("selectielijst_procestype"):
            expanded_procestype = get_procestype(procestype_url)
            if expanded_procestype is not None:
                extra_data["zaaktype"]["selectielijst_procestype"] = expanded_procestype

        return zaak

    with parallel() as executor:
        processed_zaken = list(executor.map(expand_procestype, zaken))

    return processed_zaken


def get_zaaktype_extra_info(zaaktype: dict) -> str:
    if eind_geldigheid := zaaktype.get("eind_geldigheid"):
        return _("%(identificatie)s (valid until %(end_validity)s)") % {
            "identificatie": zaaktype["identificatie"],
            "end_validity": eind_geldigheid,
        }

    return zaaktype["identificatie"]


def retrieve_zaaktypen_choices() -> list[DropDownChoice]:
    ztc_service = Service.objects.filter(api_type=APITypes.ztc).first()
    if not ztc_service:
        return []

    ztc_client = build_client(ztc_service)
    with ztc_client:
        response = ztc_client.get(
            "zaaktypen",
            headers={"Accept-Crs": "EPSG:4326"},
        )
        response.raise_for_status()
        data_iterator = pagination_helper(ztc_client, response.json())

    zaaktypen = []
    for page in data_iterator:
        zaaktypen += [
            {
                "label": result["omschrijving"],
                "value": result["url"],
                "extra": get_zaaktype_extra_info(result),
            }
            for result in page["results"]
        ]

    return zaaktypen


def format_selectielijstklasse_choice(resultaat: Resultaat) -> DropDownChoice:
    description = f"{resultaat.get('volledig_nummer', resultaat["nummer"])} - {resultaat['naam']} - {resultaat['waardering']}"
    if resultaat.get("bewaartermijn"):
        description = description + f" - {resultaat['bewaartermijn']}"

    return {
        "label": description,
        "value": resultaat["url"],
    }


@lru_cache
def retrieve_selectielijstklasse_choices(process_type_url: str) -> list:
    selectielijst_service = Service.objects.filter(api_type=APITypes.orc).first()
    if not selectielijst_service:
        return []

    client = build_client(selectielijst_service)
    with client:
        response = client.get("resultaten", params={"procesType": process_type_url})
        response.raise_for_status()
        data_iterator = pagination_helper(client, response.json())

    results = []
    for page in data_iterator:
        results += [
            format_selectielijstklasse_choice(result) for result in page["results"]
        ]

    return results

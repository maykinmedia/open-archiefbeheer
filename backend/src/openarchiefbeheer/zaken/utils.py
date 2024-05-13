from typing import Generator

from ape_pie import APIClient
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.util import underscoreize
from zgw_consumers.concurrent import parallel
from zgw_consumers.utils import PaginatedResponseData


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


def process_expanded_data(zaken: list[dict]) -> list[dict]:
    def _format_expanded_data(zaak: dict) -> dict:
        if "_expand" not in zaak:
            return zaak

        extra_data = zaak["_expand"]

        zaak["zaaktype"] = extra_data["zaaktype"]
        if "resultaat" in extra_data:
            resultaat = extra_data["resultaat"]
            resultaat_extra_data = resultaat.pop("_expand")
            resultaat["resultaattype"] = resultaat_extra_data["resultaattype"]
            zaak["resultaat"] = resultaat

        return zaak

    with parallel() as executor:
        zaken_with_expanded_info = list(executor.map(_format_expanded_data, zaken))

    return zaken_with_expanded_info

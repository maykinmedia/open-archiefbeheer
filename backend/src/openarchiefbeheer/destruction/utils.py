from zgw_consumers.concurrent import parallel

from openarchiefbeheer.destruction.models import DestructionListItem


# TODO optimise once we have a better idea of the numbers of zaken / destruction lists
def process_zaken(zaken: list[dict]) -> list[dict]:

    def check_zaak_already_in_list(zaak: dict) -> dict | None:
        if not DestructionListItem.objects.filter(zaak=zaak["url"]).exists():
            return zaak

    with parallel() as executor:
        results = executor.map(check_zaak_already_in_list, zaken)

    return [result for result in results if result is not None]

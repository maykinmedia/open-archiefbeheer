from glom import glom

from openarchiefbeheer.destruction.models import DestructionListItem


def format_selectielijst(field: dict, item: DestructionListItem) -> str:
    selectielijst = glom(item.extra_zaak_data, field["path"], default="")
    return f"{selectielijst['nummer']} - {selectielijst['naam']}"


def format_selectielijstversie(field: dict, item: DestructionListItem) -> str:
    selectielijst = glom(item.extra_zaak_data, field["path"], default="")
    return selectielijst["jaar"]


# The structure of ZAAK_METADATA_FIELDS_MAPPINGS needs to remain in sync with ZaakMetadataSerializer
ZAAK_METADATA_FIELDS_MAPPINGS = [
    {"name": "Bronapplicatie", "path": "bronapplicatie"},
    {"name": "Zaaktype Omschrijving", "path": "zaaktype.omschrijving"},
    {"name": "Zaaktype UUID", "path": "zaaktype.uuid"},
    {"name": "Zaaktype Identificatie", "path": "zaaktype.identificatie"},
    {"name": "Resultaat", "path": "resultaat.resultaattype.omschrijving"},
    {"name": "Zaak Identificatie", "path": "identificatie"},
    {"name": "Zaak Startdatum", "path": "startdatum"},
    {"name": "Zaak Einddatum", "path": "einddatum"},
    {
        "name": "Selectielijst Procestype",
        "path": "zaaktype.selectielijst_procestype",
        "format": format_selectielijst,
    },
    {
        "name": "Selectielijst versie",
        "path": "zaaktype.selectielijst_procestype",
        "format": format_selectielijstversie,
    },
]

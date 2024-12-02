# The structure of ZAAK_METADATA_FIELDS_MAPPINGS needs to remain in sync with ZaakMetadataSerializer
ZAAK_METADATA_FIELDS_MAPPINGS = [
    {"name": "Zaaktype UUID", "path": "zaaktype.uuid"},
    {"name": "Zaaktype Omschrijving", "path": "zaaktype.omschrijving"},
    {"name": "Zaaktype Identificatie", "path": "zaaktype.identificatie"},
    {"name": "Zaak Identificatie", "path": "identificatie"},
    {"name": "Zaak Startdatum", "path": "startdatum"},
    {"name": "Zaak Einddatum", "path": "omschrijving"},
    {
        "name": "Selectielijst Procestype",
        "path": "zaaktype.selectielijst_procestype.naam",
    },
    {"name": "Resultaat", "path": "resultaattype.omschrijving"},
]

# The structure of ZAAK_METADATA_FIELDS_MAPPINGS needs to remain in sync with ZaakMetadataSerializer
ZAAK_METADATA_FIELDS_MAPPINGS = [
    {"name": "url", "path": "url"},
    {"name": "einddatum", "path": "einddatum"},
    {"name": "resultaat", "path": "resultaat"},
    {"name": "startdatum", "path": "startdatum"},
    {"name": "omschrijving", "path": "omschrijving"},
    {"name": "identificatie", "path": "identificatie"},
    {"name": "zaaktype url", "path": "zaaktype.url"},
    {"name": "zaaktype omschrijving", "path": "zaaktype.omschrijving"},
    {
        "name": "selectielijst procestype nummer",
        "path": "zaaktype.selectielijst_procestype.nummer",
    },
]

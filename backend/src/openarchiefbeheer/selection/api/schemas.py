from drf_spectacular.utils import OpenApiExample, OpenApiRequest, OpenApiResponse

SCHEMA_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "additionalProperties": {
            "type": "object",
            "description": "The zaak URL is used as key",
            "properties": {
                "selected": {"type": "boolean"},
                "detail": {"type": "object"},
            },
        },
    },
    examples=[
        OpenApiExample(
            "A selection",
            value={
                "http://zaken.nl/api/v1/zaken/111-111-111": {
                    "selected": True,
                    "detail": {},
                },
                "http://zaken.nl/api/v1/zaken/222-222-222": {
                    "selected": False,
                    "detail": {},
                },
            },
        ),
    ],
)

SCHEMA_REQUEST = OpenApiRequest(
    request={
        "type": "object",
        "additionalProperties": {
            "type": "object",
            "description": "The zaak URL is used as key",
            "properties": {
                "selected": {"type": "boolean"},
                "detail": {"type": "object"},
            },
        },
    },
    examples=[
        OpenApiExample(
            "Add to the selection",
            value={
                "http://zaken.nl/api/v1/zaken/111-111-111": {
                    "selected": True,
                    "detail": {},
                },
                "http://zaken.nl/api/v1/zaken/222-222-222": {
                    "selected": False,
                    "detail": {},
                },
            },
        ),
    ],
)


SCHEMA_SELECTION_REQUEST = OpenApiRequest(
    request={
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "description": "Filter on specific items in the selection",
                "items": {"type": "string"},
            }
        },
    },
    examples=[
        OpenApiExample(
            "Add to the selection",
            value={
                "items": [
                    "http://zaken.nl/api/v1/zaken/111-111-111",
                    "http://zaken.nl/api/v1/zaken/222-222-222",
                ]
            },
        ),
    ],
)

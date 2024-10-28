from drf_spectacular.utils import OpenApiExample, OpenApiRequest, OpenApiResponse

SCHEMA_RESPONSE = OpenApiResponse(
    response={
        "type": "object",
        "additionalProperties": {
            "type": "object",
            "description": "The zaak URL is used as key",
            "properties": {
                "selected": {"type": "boolean"},
                "details": {"type": "object"},
            },
        },
    },
    examples=[
        OpenApiExample(
            "A selection",
            value={
                "http://zaken.nl/api/v1/zaken/111-111-111": {
                    "selected": True,
                    "details": {},
                },
                "http://zaken.nl/api/v1/zaken/222-222-222": {
                    "selected": False,
                    "details": {},
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
                "details": {"type": "object"},
            },
        },
    },
    examples=[
        OpenApiExample(
            "Add to the selection",
            value={
                "http://zaken.nl/api/v1/zaken/111-111-111": {
                    "selected": True,
                    "details": {},
                },
                "http://zaken.nl/api/v1/zaken/222-222-222": {
                    "selected": False,
                    "details": {},
                },
            },
        ),
    ],
)

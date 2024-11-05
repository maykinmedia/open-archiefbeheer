from drf_spectacular.generators import SchemaGenerator
from drf_spectacular.plumbing import (
    OpenApiTypes,
    build_basic_type,
    build_examples_list,
    build_object_type,
    force_instance,
)
from rest_framework.request import Request

from ..schemas import SCHEMA_RESPONSE


def update_schema_for_dynamic_keys(
    result: dict, generator: SchemaGenerator, request: Request, public: bool
) -> dict:
    openapi_response_schema = force_instance(SCHEMA_RESPONSE)

    result["paths"]["/api/v1/selections/{key}/"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"] = openapi_response_schema.response
    result["paths"]["/api/v1/selections/{key}/"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["examples"] = build_examples_list(openapi_response_schema.examples)

    result["paths"]["/api/v1/selections/{key}/count/"]["get"]["responses"]["200"][
        "content"
    ]["application/json"]["schema"] = build_object_type(
        {"count": build_basic_type(OpenApiTypes.INT)}
    )
    return result

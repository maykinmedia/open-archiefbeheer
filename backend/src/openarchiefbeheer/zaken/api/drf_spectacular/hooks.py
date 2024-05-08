from djangorestframework_camel_case.util import camel_to_underscore
from drf_spectacular.contrib.djangorestframework_camel_case import (
    camelize_serializer_fields,
)
from drf_spectacular.generators import SchemaGenerator
from rest_framework.request import Request


def camelize_serializer_fields_but_not_query_parameters(
    result: dict, generator: SchemaGenerator, request: Request, public: bool
) -> dict:
    result = camelize_serializer_fields(result, generator, request, public)

    # Undo camelisation of query-parameters
    for url_schema in result["paths"].values():
        for method_schema in url_schema.values():
            for parameter in method_schema.get("parameters", []):
                parameter["name"] = camel_to_underscore(parameter["name"], options={})

    return result

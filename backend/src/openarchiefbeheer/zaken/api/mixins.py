from django.utils.cache import patch_cache_control, patch_response_headers

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

from openarchiefbeheer.utils.datastructure import HashableDict

from .serializers import ZaaktypeFilterSerializer


class FilterOnZaaktypeMixin:
    def get_query_params(self, request: Request) -> HashableDict:
        serializer = ZaaktypeFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        query_params = HashableDict()
        query_params.update(serializer.data)

        return query_params


class ChoicesMixin:
    def no_cache_response(self, json_data: dict) -> Response:
        response = Response(json_data, status=status.HTTP_200_OK)
        patch_response_headers(response, cache_timeout=-1)
        patch_cache_control(
            # private must not be set, private=False does not work
            response,
            no_cache=True,
            no_store=True,
            must_revalidate=True,
        )
        return response

from rest_framework.request import Request

from openarchiefbeheer.utils.datastructure import HashableDict

from .serializers import ZaaktypeFilterSerializer


class FilterOnZaaktypeMixin:
    def get_query_params(self, request: Request) -> HashableDict:
        serializer = ZaaktypeFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        query_params = HashableDict()
        query_params.update(serializer.validated_data)

        return query_params

from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema
from requests.exceptions import RequestException
from rest_framework.renderers import JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service


@extend_schema(
    summary=_("List zaken"),
    description=_(
        "Retrieve zaken using the configured ZRC service. "
        "For information over the query parameters accepted and the schema of the response, look at the "
        "'/zaken/api/v1/zaken' list endpoint of Open Zaak."
    ),
)
class ZakenView(APIView):
    # We don't want the CamelCase renderer to alter the responses from Open Zaak
    renderer_classes = (JSONRenderer,)

    def get(self, request: Request) -> Response:
        zrc_service = Service.objects.get(api_type=APITypes.zrc)
        zrc_client = build_client(zrc_service)

        with zrc_client:
            response = zrc_client.get(
                "zaken",
                headers={"Accept-Crs": "EPSG:4326"},
                params=request.query_params,
            )

        try:
            response.raise_for_status()
        except RequestException:
            return Response({"error": response.json()}, status=response.status_code)

        return Response(response.json(), status=response.status_code)

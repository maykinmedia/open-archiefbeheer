from django.utils.decorators import method_decorator
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import cache_page

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.destruction.api.permissions import (
    CanReviewPermission,
    CanStartDestructionPermission,
)

from ..models import Zaak
from ..tasks import retrieve_and_cache_zaken_from_openzaak
from ..utils import retrieve_selectielijstklasse_choices, retrieve_zaaktypen_choices
from .serializers import (
    SelectielijstklasseChoicesQueryParamSerializer,
    SelectielijstklasseChoicesSerializer,
    ZaaktypeChoiceSerializer,
)


class CacheZakenView(APIView):
    permission_classes = (IsAdminUser,)

    @extend_schema(
        summary=_("Retrieve and cache zaken"),
        description=_("Retrieve and cache zaken from OpenZaak in the background."),
        tags=["private"],
    )
    def post(self, request, *args, **kwargs):
        retrieve_and_cache_zaken_from_openzaak.delay()
        return Response(status=status.HTTP_200_OK)


class ZaaktypenChoicesView(APIView):
    permission_classes = [
        IsAuthenticated & (CanStartDestructionPermission | CanReviewPermission)
    ]

    @extend_schema(
        summary=_("Retrieve zaaktypen choices"),
        description=_(
            "Retrieve zaaktypen from Open Zaak and return a value and a label per zaaktype. "
            "The label is the 'identificatie' field an the value is a string of comma separated URLs. "
            "There are multiple URLs per identificatie if there are multiple versions of a zaaktype. "
            "If there are no zaken of a particular zaaktype in the database, then that zaaktype is not returned. "
            "The response is cached for 15 minutes."
        ),
        tags=["private"],
        responses={
            200: ZaaktypeChoiceSerializer,
        },
    )
    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        zaaktypen_choices = retrieve_zaaktypen_choices()
        serializer = ZaaktypeChoiceSerializer(data=zaaktypen_choices, many=True)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SelectielijstklasseChoicesView(APIView):
    permission_classes = [IsAuthenticated & CanStartDestructionPermission]

    @extend_schema(
        summary=_("Retrieve selectielijstklasse choices"),
        description=_(
            "This takes the 'selectielijstprocestype' from the 'zaaktype', "
            "then retrieves all the 'resultaten' possible for this 'procestype' from the selectielijst API."
        ),
        tags=["private"],
        responses={
            200: SelectielijstklasseChoicesSerializer,
        },
        parameters=[SelectielijstklasseChoicesQueryParamSerializer],
    )
    def get(self, request, *args, **kwargs):
        seralizer = SelectielijstklasseChoicesQueryParamSerializer(
            data=request.query_params
        )
        seralizer.is_valid(raise_exception=True)

        zaak = Zaak.objects.get(url=seralizer.validated_data["zaak"])

        processtype = zaak._expand["zaaktype"].get("selectielijst_procestype")

        if not processtype:
            return Response(data=[])

        choices = retrieve_selectielijstklasse_choices(processtype["url"])
        return Response(data=choices)

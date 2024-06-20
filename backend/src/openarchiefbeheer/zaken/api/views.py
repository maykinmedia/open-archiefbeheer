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

from ..tasks import retrieve_and_cache_zaken_from_openzaak
from ..utils import retrieve_zaaktypen_choices
from .serializers import ZaaktypeChoiceSerializer


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
            "The label is the 'omschrijving' field an the value is the URL. "
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

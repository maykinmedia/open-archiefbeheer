from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema
from mozilla_django_oidc_db.models import OpenIDConnectConfig
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.destruction.api.permissions import CanConfigureApplication

from ..models import ArchiveConfig
from .serializers import (
    ApplicationInfoSerializer,
    ArchiveConfigSerializer,
    OIDCInfoSerializer,
)


class ArchiveConfigView(APIView):
    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        if self.request.method in ["PATCH", "PUT"]:
            permissions.append(CanConfigureApplication())

        return permissions

    @extend_schema(
        tags=["Configuration"],
        summary=_("Retrieve archive configuration"),
        description=_("Retrieve archive configuration."),
        responses={200: ArchiveConfigSerializer},
    )
    def get(self, request, *args, **kwargs) -> Response:
        config = ArchiveConfig.get_solo()

        serializer = ArchiveConfigSerializer(instance=config)
        return Response(data=serializer.data)

    def update(self, *, partial: bool = False) -> Response:
        config = ArchiveConfig.get_solo()

        serializer = ArchiveConfigSerializer(
            instance=config, data=self.request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(data=serializer.data)

    @extend_schema(
        tags=["Configuration"],
        summary=_("Update archive configuration"),
        description=_("Update archive configuration."),
        request=ArchiveConfigSerializer,
        responses={200: ArchiveConfigSerializer},
    )
    def put(self, request, *args, **kwargs) -> Response:
        return self.update()

    @extend_schema(
        tags=["Configuration"],
        summary=_("Update archive configuration"),
        description=_("Partially update archive configuration."),
        request=ArchiveConfigSerializer,
        responses={200: ArchiveConfigSerializer},
    )
    def patch(self, request, *args, **kwargs) -> Response:
        return self.update(partial=True)


class OIDCInfoView(APIView):
    authentication_classes = ()
    permission_classes = ()

    @extend_schema(
        summary=_("Retrieve OIDC info"),
        description=_("Returns info about OIDC that is needed by the frontend. "),
        tags=["Configuration"],
        responses={
            200: OIDCInfoSerializer,
        },
    )
    def get(self, request: Request, *args, **kwargs):
        config = OpenIDConnectConfig.get_solo()
        serializer = OIDCInfoSerializer(instance=config, context={"request": request})
        return Response(serializer.data)


@extend_schema(
    tags=["Configuration"],
    summary=_("App info"),
    description=_("Returns information about the application."),
    responses={
        200: ApplicationInfoSerializer(),
    },
)
class ApplicationInfoView(APIView):
    def get(self, request: Request, *args, **kwargs):
        serializer = ApplicationInfoSerializer(data={})
        serializer.is_valid()

        return Response(serializer.data)

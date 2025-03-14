from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema, inline_serializer
from mozilla_django_oidc_db.models import OpenIDConnectConfig
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from openarchiefbeheer.destruction.api.permissions import CanStartDestructionPermission

from ..health_checks import is_configuration_complete
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
            permissions.append(CanStartDestructionPermission())

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


class HealthCheckView(APIView):
    @extend_schema(
        summary=_("Get health check"),
        description=_(
            "Returns whether everything that should have been configured was configured."
        ),
        tags=["Configuration"],
        responses={
            200: inline_serializer(
                name="HealthCheckResponse",
                fields={
                    "success": serializers.BooleanField(
                        help_text="Whether the configuration is complete."
                    ),
                    "errors": inline_serializer(
                        name="HealthCheckError",
                        many=True,
                        fields={
                            "model": serializers.CharField(
                                help_text="The model that is not properly configured."
                            ),
                            "code": serializers.CharField(
                                help_text="A code name for the error."
                            ),
                            "message": serializers.CharField(
                                help_text="A human readable error message."
                            ),
                            "severity": serializers.ChoiceField(
                                help_text="Whether this is an error, warning or info.",
                                choices=["error", "warning", "info"],
                            ),
                            "field": serializers.CharField(
                                help_text="The field of a model that is not properly configured. Can be empty.",
                                required=False,
                            ),
                        },
                    ),
                },
            ),
        },
    )
    def get(self, request: Request, *args, **kwargs):
        results = is_configuration_complete()
        return Response(results)


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

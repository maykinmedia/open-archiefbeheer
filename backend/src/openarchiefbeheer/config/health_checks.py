from dataclasses import dataclass
from typing import Literal, TypedDict

from django.conf import settings
from django.utils.translation import gettext_lazy as _

from maykin_health_checks.checks import HealthCheck
from maykin_health_checks.types import HealthCheckResult as _HealthCheckResult
from zgw_consumers.models import Service

from openarchiefbeheer.registers.plugin import AbstractBasePlugin
from openarchiefbeheer.registers.registry import register as registry
from openarchiefbeheer.types import JSONValue

from .models import APIConfig, ArchiveConfig


class HealthCheckError(TypedDict, total=False):
    model: str
    code: str
    message: str
    severity: Literal["error", "warning", "info"]
    field: str


@dataclass
class HealthCheckResult:
    health_check: HealthCheck
    success: bool
    model: str = ""
    code: str = ""
    message: str = ""
    severity: Literal["error", "warning", "info"] = "error"

    def pretty_print(self) -> str:
        if self.success:
            return ""

        return f"{self.health_check.human_name}: {self.message}"

    # TODO: shouldn't do this by hand
    def serialize(self) -> JSONValue:
        if self.success:
            return {
                "success": self.success,
            }

        return {
            "success": self.success,
            "message": self.message,
            "code": self.code,
            "model": self.model,
            "severity": self.severity,
        }


class MissingServiceHealthCheck(HealthCheck):
    human_name = _("Missing services check")
    identifier = "missing_services"

    def run(self) -> HealthCheckResult:
        missing_services = []

        for needed_service_type in settings.ZGW_REQUIRED_SERVICE_TYPES:
            service = Service.objects.filter(api_type=needed_service_type).first()

            if not service:
                missing_services.append(needed_service_type)

        api_config = APIConfig.get_solo()
        if not api_config.selectielijst_api_service:
            missing_services.append("selectielijst")

        if missing_services:
            return HealthCheckResult(
                health_check=self,
                code="missing_service",
                model="zgw_consumers.models.Service",
                message=_("Missing service(s): {missing_services}").format(
                    missing_services=missing_services
                ),
                success=False,
            )

        return HealthCheckResult(health_check=self, success=True)


@dataclass
class MisconfiguredServicesCheckResult(HealthCheckResult):
    errors: list[HealthCheckError] | None = None


class MisconfiguredServiceHealthCheck(HealthCheck):
    human_name = _("Misconfigured services check")
    identifier = "misconfigured_services"

    def run(self) -> MisconfiguredServicesCheckResult:
        errors = []
        for service in Service.objects.all():
            service_connection_result = service.connection_check
            if service_connection_result is None or (
                service_connection_result and not 200 <= service_connection_result < 300
            ):
                errors.append(
                    HealthCheckError(
                        code="improperly_configured_service",
                        message=_(
                            'Service "{service}" is improperly configured.'
                        ).format(service=service.label),
                        severity="error",
                    )
                )

        return MisconfiguredServicesCheckResult(
            health_check=self, success=len(errors) == 0, errors=errors or None
        )


class APIConfigCheck(HealthCheck):
    human_name = _("API Configuration Check")
    identifier = "apiconfig"

    def run(self) -> HealthCheckResult:
        api_config = APIConfig.get_solo()
        assert api_config.selectielijst_api_service
        if api_config.selectielijst_api_service.connection_check != 200:
            return HealthCheckResult(
                health_check=self,
                success=False,
                message=_("Missing selectielijst API service"),
                model="openarchiefbeheer.config.APIConfig",
            )
        return HealthCheckResult(health_check=self, success=True)


class ArchiveConfigHealthCheck(HealthCheck):
    human_name = _("Archive Configuration Check")
    identifier = "archiveconfig"

    def run(self) -> HealthCheckResult:
        missing_fields = []
        archive_config = ArchiveConfig.get_solo()
        if not archive_config.bronorganisatie:
            missing_fields.append("bronorganisatie")
        if not archive_config.zaaktype:
            missing_fields.append("zaaktype")
        if not archive_config.resultaattype:
            missing_fields.append("resultaattype")
        if not archive_config.informatieobjecttype:
            missing_fields.append("informatieobjecttype")

        if missing_fields:
            return HealthCheckResult(
                health_check=self,
                success=False,
                message=_("Missing settings(s): {missing_fields}").format(
                    missing_fields=missing_fields
                ),
                model="openarchiefbeheer.config.ArchiveConfig",
            )
        return HealthCheckResult(health_check=self, success=True)


class PluginHealthCheck(HealthCheck):
    plugin = AbstractBasePlugin

    def run(self) -> _HealthCheckResult:
        return self.plugin.check_config()


def checks_collector() -> list[HealthCheck]:
    checks = [
        MissingServiceHealthCheck(),
        MisconfiguredServiceHealthCheck(),
        APIConfigCheck(),
        ArchiveConfigHealthCheck(),
    ]
    checks.extend(
        [
            PluginHealthCheck(
                identifier=plugin.identifier,
                plugin=plugin,
                human_name=plugin.verbose_name,
            )
            for plugin in registry
        ]
    )

    return checks

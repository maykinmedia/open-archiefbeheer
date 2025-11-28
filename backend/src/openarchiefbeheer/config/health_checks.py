from dataclasses import dataclass

from django.conf import settings
from django.utils.translation import gettext as _

from maykin_health_checks.types import HealthCheck, HealthCheckResult
from msgspec import UNSET
from zgw_consumers.models import Service

from openarchiefbeheer.external_registers.plugin import AbstractBasePlugin
from openarchiefbeheer.external_registers.registry import register as registry
from openarchiefbeheer.utils.health_checks import CheckResult, ExtraInfo

from .models import APIConfig, ArchiveConfig


@dataclass
class ServiceHealthCheck:
    identifier = "services_presence"

    def run(self) -> CheckResult:
        missing_services = []

        for needed_service_type in settings.ZGW_REQUIRED_SERVICE_TYPES:
            service = Service.objects.filter(api_type=needed_service_type).first()

            if not service:
                missing_services.append(needed_service_type)

        api_config = APIConfig.get_solo()
        if not api_config.selectielijst_api_service:
            missing_services.append("selectielijst")

        if missing_services:
            return CheckResult(
                identifier=self.identifier,
                message=_("Missing service(s): {missing_services}").format(
                    missing_services=missing_services
                ),
                success=False,
                extra=[
                    ExtraInfo(
                        code="missing_service",
                        model="zgw_consumers.models.Service",
                    )
                ],
            )

        return CheckResult(
            identifier=self.identifier,
            success=True,
            message=_("All expected services configured correctly."),
        )


@dataclass
class ServiceConfigurationHealthCheck:
    identifier = "services_configuration"

    def run(self) -> CheckResult:
        errors = []
        for service in Service.objects.all():
            service_connection_result = service.connection_check
            if service_connection_result is None or (
                service_connection_result and not 200 <= service_connection_result < 300
            ):
                errors.append(
                    ExtraInfo(
                        code="improperly_configured_service",
                        message=service.label,
                        severity="error",
                        model="zgw_consumers.models.Service",
                    )
                )

        has_errors = len(errors) > 0
        return CheckResult(
            identifier=self.identifier,
            success=not has_errors,
            extra=errors if has_errors else UNSET,
            message=(
                _("Found some misconfigured services")
                if has_errors
                else _("No misconfigured services")
            ),
        )


@dataclass
class APIConfigCheck:
    identifier = "apiconfig"

    def run(self) -> CheckResult:
        api_config = APIConfig.get_solo()

        if not api_config.selectielijst_api_service:
            return CheckResult(
                identifier=self.identifier,
                success=False,
                message=_(
                    "No selectielijst API services selected in the API configuration page."
                ),
                extra=[
                    ExtraInfo(
                        code="missing_service",
                        model="openarchiefbeheer.config.APIConfig",
                        field="selectielijst_api_service",
                    )
                ],
            )
        return CheckResult(
            identifier=self.identifier,
            success=True,
            message=_("The API settings are properly configured."),
        )


@dataclass
class ArchiveConfigHealthCheck:
    identifier = "archiveconfig"

    def run(self) -> CheckResult:
        errors = []
        archive_config = ArchiveConfig.get_solo()
        if not archive_config.bronorganisatie:
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="missing_field",
                    field="bronorganisatie",
                )
            )
        if not archive_config.zaaktype:
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="missing_field",
                    field="zaaktype",
                )
            )
        if not archive_config.resultaattype:
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="missing_field",
                    field="resultaattype",
                )
            )
        if not archive_config.informatieobjecttype:
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="missing_field",
                    field="informatieobjecttype",
                )
            )

        if errors:
            return CheckResult(
                identifier=self.identifier,
                success=False,
                message=_("Missing settings(s): {missing_fields}").format(
                    missing_fields=errors
                ),
                extra=errors,
            )
        return CheckResult(
            identifier=self.identifier,
            success=True,
            message=_("The archiving settings are properly configured."),
        )


@dataclass
class PluginHealthCheck:
    identifier: str
    plugin: AbstractBasePlugin

    def run(self) -> HealthCheckResult:
        return self.plugin.check_config()


def checks_collector() -> list[HealthCheck]:
    checks = [
        ServiceHealthCheck(),
        ServiceConfigurationHealthCheck(),
        APIConfigCheck(),
        ArchiveConfigHealthCheck(),
    ]
    checks.extend(
        [
            PluginHealthCheck(
                identifier=plugin.identifier,
                plugin=plugin,
            )
            for plugin in registry
        ]
    )

    return checks

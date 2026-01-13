from dataclasses import dataclass

from django.utils.translation import gettext as _

from maykin_config_checks import HealthCheck, HealthCheckResult, Slug
from msgspec import UNSET
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from openarchiefbeheer.external_registers.plugin import AbstractBasePlugin
from openarchiefbeheer.external_registers.registry import register as registry
from openarchiefbeheer.utils.health_checks import CheckResult, ExtraInfo

from .models import APIConfig, ArchiveConfig

ZGW_REQUIRED_SERVICE_TYPES = [APITypes.zrc, APITypes.drc, APITypes.ztc, APITypes.brc]


@dataclass
class ServiceHealthCheck:
    identifier = "services_presence"
    verbose_name = _("Services presence")

    def __call__(self) -> CheckResult:
        missing_services = []

        for needed_service_type in ZGW_REQUIRED_SERVICE_TYPES:
            service = Service.objects.filter(api_type=needed_service_type).first()

            if not service:
                missing_services.append(needed_service_type)

        api_config = APIConfig.get_solo()
        if not api_config.selectielijst_api_service:
            missing_services.append("selectielijst")

        if missing_services:
            return CheckResult(
                identifier=self.identifier,
                verbose_name=self.verbose_name,
                message=_("Missing service(s): {missing_services}").format(
                    missing_services=",".join(missing_services)
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
            verbose_name=self.verbose_name,
            success=True,
            message=_("All expected services are present."),
        )


@dataclass
class ServiceConfigurationHealthCheck:
    identifier = "services_configuration"
    verbose_name = _("Services configuration")

    def __call__(self) -> CheckResult:
        errors = []
        for service in Service.objects.all():
            service_connection_result = service.connection_check
            if service_connection_result is None or (
                service_connection_result and not 200 <= service_connection_result < 300
            ):
                errors.append(
                    ExtraInfo(
                        code="improperly_configured_service",
                        message=_("Connection check failed for Service: %(label)s")
                        % {"label": service.label},
                        severity="error",
                        model="zgw_consumers.models.Service",
                    )
                )

        has_errors = len(errors) > 0
        return CheckResult(
            identifier=self.identifier,
            verbose_name=self.verbose_name,
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
    verbose_name = _("API configuration")

    def __call__(self) -> CheckResult:
        api_config = APIConfig.get_solo()

        if not api_config.selectielijst_api_service:
            return CheckResult(
                identifier=self.identifier,
                verbose_name=self.verbose_name,
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
            verbose_name=self.verbose_name,
            success=True,
            message=_("The API settings are properly configured."),
        )


@dataclass
class ArchiveConfigHealthCheck:
    identifier = "archiveconfig"
    verbose_name = _("Archive configuration")

    def __call__(self) -> CheckResult:
        errors = []
        archive_config = ArchiveConfig.get_solo()
        if not archive_config.bronorganisatie:
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="missing_field",
                    field="bronorganisatie",
                    message=_(
                        "The bronorganisatie field is missing in the destruction report settings."
                    ),
                )
            )
        if not archive_config.zaaktype:
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="missing_field",
                    field="zaaktype",
                    message=_(
                        "The zaaktype field is missing in the destruction report settings."
                    ),
                )
            )
        # Github issue 884: zaaktype field was changed from the identificatie to the URL.
        # Let's warn the user if the configuration is wrong.
        if archive_config.zaaktype and not (
            archive_config.zaaktype.startswith("http://")
            or archive_config.zaaktype.startswith("https://")
        ):
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="invalid_field",
                    field="zaaktype",
                    message=_(
                        "The configuration for the destruction report has an invalid zaaktype. "
                        "Reconfigure the zaaktype and save the destruction report settings."
                    ),
                )
            )
        if not archive_config.resultaattype:
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="missing_field",
                    field="resultaattype",
                    message=_(
                        "The resultaattype field is missing in the destruction report settings."
                    ),
                )
            )
        if not archive_config.informatieobjecttype:
            errors.append(
                ExtraInfo(
                    model="openarchiefbeheer.config.ArchiveConfig",
                    code="missing_field",
                    field="informatieobjecttype",
                    message=_(
                        "The informatieobjecttype field is missing in the destruction report settings."
                    ),
                )
            )

        if errors:
            return CheckResult(
                identifier=self.identifier,
                verbose_name=self.verbose_name,
                success=False,
                message=_(
                    "Missing or invalid settings(s) for the Archive configuration."
                ),
                extra=errors,
            )
        return CheckResult(
            identifier=self.identifier,
            verbose_name=self.verbose_name,
            success=True,
            message=_("The Archive configuration is properly configured."),
        )


@dataclass
class PluginHealthCheck:
    identifier: Slug
    verbose_name: str
    plugin: AbstractBasePlugin

    def __call__(self) -> HealthCheckResult:
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
                identifier=identifier,
                verbose_name=plugin.verbose_name,
                plugin=plugin,
            )
            for identifier, plugin in registry.iterate()
        ]
    )

    return checks

from typing import Literal, TypedDict

from django.utils.translation import gettext_lazy as _

from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from .models import APIConfig, ArchiveConfig


class HealthCheckError(TypedDict, total=False):
    model: str
    code: str
    message: str
    severity: Literal["error", "warning", "info"]
    field: str


class HealthCheckResponse(TypedDict):
    success: bool
    errors: list[HealthCheckError]


SERVICES_ERRORS = {
    "MISSING_ZRC_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="MISSING_ZRC_SERVICE",
        message=_("ZRC service is missing."),
        severity="error",
    ),
    "MISSING_DRC_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="MISSING_DRC_SERVICE",
        message=_("DRC service is missing."),
        severity="error",
    ),
    "MISSING_BRC_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="MISSING_BRC_SERVICE",
        message=_("BRC service is missing."),
        severity="error",
    ),
    "MISSING_ZTC_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="MISSING_ZTC_SERVICE",
        message=_("ZTC service is missing."),
        severity="error",
    ),
    "IMPROPERLY_CONFIGURED_ZRC_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="IMPROPERLY_CONFIGURED_ZRC_SERVICE",
        message=_("The ZRC service is improperly configured."),
        severity="error",
    ),
    "IMPROPERLY_CONFIGURED_DRC_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="IMPROPERLY_CONFIGURED_DRC_SERVICE",
        message=_("The DRC service is improperly configured."),
        severity="error",
    ),
    "IMPROPERLY_CONFIGURED_BRC_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="IMPROPERLY_CONFIGURED_BRC_SERVICE",
        message=_("The BRC service is improperly configured."),
        severity="error",
    ),
    "IMPROPERLY_CONFIGURED_ZTC_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="IMPROPERLY_CONFIGURED_ZTC_SERVICE",
        message=_("The ZTC service is improperly configured."),
        severity="error",
    ),
    "IMPROPERLY_CONFIGURED_SELECTIELIJST_SERVICE": HealthCheckError(
        model="zgw_consumers.models.Service",
        code="IMPROPERLY_CONFIGURED_SELECTIELIJST_SERVICE",
        message=_("The selectielijst service is improperly configured."),
        severity="error",
    ),
}

API_CONFIG_ERRORS = {
    "MISSING_SELECTIELIJST_API": HealthCheckError(
        model="openarchiefbeheer.config.APIConfig",
        field="selectielijst_api_service",
        code="MISSING_SELECTIELIJST_API",
        message=_("No selectielijst service selected in the API configuration."),
        severity="error",
    )
}

ARCHIVE_CONFIG_ERRORS = {
    "MISSING_BRONORGANISATIE": HealthCheckError(
        model="openarchiefbeheer.config.ArchiveConfig",
        field="bronorganisatie",
        code="MISSING_BRONORGANISATIE",
        message=_("No source organisation for the destruction report case configured."),
        severity="error",
    ),
    "MISSING_ZAAKTYPE": HealthCheckError(
        model="openarchiefbeheer.config.ArchiveConfig",
        field="zaaktype",
        code="MISSING_ZAAKTYPE",
        message=_("No zaaktype for the destruction report case configured."),
        severity="error",
    ),
    "MISSING_RESULTAATTYPE": HealthCheckError(
        model="openarchiefbeheer.config.ArchiveConfig",
        field="resultaattype",
        code="MISSING_RESULTAATTYPE",
        message=_("No resultaattype for the destruction report case configured."),
        severity="error",
    ),
    "MISSING_INFORMATIEOBJECTTYPE": HealthCheckError(
        model="openarchiefbeheer.config.ArchiveConfig",
        field="informatieobjecttype",
        code="MISSING_INFORMATIEOBJECTTYPE",
        message=_(
            "No informatieobjecttype for the destruction report document configured."
        ),
        severity="error",
    ),
}


def is_configuration_complete() -> HealthCheckResponse:
    errors = []
    # Are services for Zaken, Documenten, Catalogi, Besluiten APIs configured?
    if not (zrc_service := Service.objects.filter(api_type=APITypes.zrc).first()):
        errors.append(SERVICES_ERRORS["MISSING_ZRC_SERVICE"])

    if not (drc_service := Service.objects.filter(api_type=APITypes.drc).first()):
        errors.append(SERVICES_ERRORS["MISSING_DRC_SERVICE"])

    if not (brc_service := Service.objects.filter(api_type=APITypes.brc).first()):
        errors.append(SERVICES_ERRORS["MISSING_BRC_SERVICE"])

    if not (ztc_service := Service.objects.filter(api_type=APITypes.ztc).first()):
        errors.append(SERVICES_ERRORS["MISSING_ZTC_SERVICE"])

    # Are they **properly** configured?
    if zrc_service and zrc_service.connection_check != 200:
        errors.append(SERVICES_ERRORS["IMPROPERLY_CONFIGURED_ZRC_SERVICE"])
    if drc_service and drc_service.connection_check != 200:
        errors.append(SERVICES_ERRORS["IMPROPERLY_CONFIGURED_DRC_SERVICE"])
    if brc_service and brc_service.connection_check != 200:
        errors.append(SERVICES_ERRORS["IMPROPERLY_CONFIGURED_BRC_SERVICE"])
    if ztc_service and ztc_service.connection_check != 200:
        errors.append(SERVICES_ERRORS["IMPROPERLY_CONFIGURED_ZTC_SERVICE"])

    # Is the selectielijst API specified and working?
    api_config = APIConfig.get_solo()
    if not api_config.selectielijst_api_service:
        errors.append(API_CONFIG_ERRORS["MISSING_SELECTIELIJST_API"])
    elif api_config.selectielijst_api_service.connection_check != 200:
        errors.append(SERVICES_ERRORS["IMPROPERLY_CONFIGURED_SELECTIELIJST_SERVICE"])

    # Is the configuration for creating the destruction report filled in?
    archive_config = ArchiveConfig.get_solo()
    if not archive_config.bronorganisatie:
        errors.append(ARCHIVE_CONFIG_ERRORS["MISSING_BRONORGANISATIE"])
    if not archive_config.zaaktype:
        errors.append(ARCHIVE_CONFIG_ERRORS["MISSING_ZAAKTYPE"])
    if not archive_config.resultaattype:
        errors.append(ARCHIVE_CONFIG_ERRORS["MISSING_RESULTAATTYPE"])
    if not archive_config.informatieobjecttype:
        errors.append(ARCHIVE_CONFIG_ERRORS["MISSING_INFORMATIEOBJECTTYPE"])

    return HealthCheckResponse(success=len(errors) == 0, errors=errors)

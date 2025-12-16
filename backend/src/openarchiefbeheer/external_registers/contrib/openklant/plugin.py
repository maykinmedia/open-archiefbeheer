from collections.abc import Iterable
from functools import partial
from typing import Mapping, NoReturn

from django.db.models.functions import Length
from django.utils.translation import gettext as _

from maykin_health_checks.types import HealthCheckResult
from zgw_consumers.client import build_client

from openarchiefbeheer.external_registers.contrib.openklant.constants import (
    OPENKLANT_IDENTIFIER,
)
from openarchiefbeheer.external_registers.plugin import (
    AbstractBasePlugin,
    RelatedResourceList,
    ServiceSlug,
)
from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.external_registers.setup_configuration.models import (
    ExternalRegisterConfigurationModel,
)
from openarchiefbeheer.utils.health_checks import CheckResult, ExtraInfo
from openarchiefbeheer.utils.results_store import (
    ResultStore,
    delete_object_and_store_result,
)

from .setup_configuration.steps import OpenKlantConfigurationStep


@register(OPENKLANT_IDENTIFIER)
class OpenKlantPlugin(AbstractBasePlugin):
    verbose_name = "Open Klant plugin"
    setup_configuration_model = ExternalRegisterConfigurationModel
    setup_configuration_step = OpenKlantConfigurationStep

    def check_config(self) -> HealthCheckResult:
        config = self.get_or_create_config()
        if not config.enabled:
            return CheckResult(
                identifier=self.identifier,
                success=True,
                message=_("The Open Klant plugin is disabled."),
            )

        if not config.services.count() > 0:
            return CheckResult(
                identifier=self.identifier,
                success=False,
                message=_("No Open Klant API service(s) configured."),
                extra=[
                    ExtraInfo(
                        code="missing_service",
                        model="openarchiefbeheer.external_registers.contrib.openklant.models.OpenKlantConfig",
                        field="services",
                    )
                ],
            )
        return CheckResult(
            identifier=self.identifier,
            success=True,
            message=_("The Open Klant settings are properly configured."),
        )

    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

    def get_related_resources(
        self, zaak_url: str
    ) -> Mapping[ServiceSlug, RelatedResourceList[dict]]:
        """Return the resources in the external register related to this zaak."""
        raise NotImplementedError()

    def delete_related_resources(
        self, related_resources: Iterable[str], result_store: ResultStore
    ) -> None | NoReturn:
        config = self.get_or_create_config()
        services_candidates = (
            config.services.all()
            .annotate(api_root_length=Length("api_root"))
            .order_by("-api_root_length")
        )
        clients = {
            service.slug: build_client(service) for service in services_candidates
        }

        for resource_url in related_resources:
            for service in services_candidates:
                if not resource_url.startswith(service.api_root):
                    continue

                delete_object_and_store_result(
                    result_store,
                    "klantcontacten",
                    resource_url,
                    partial(
                        clients[service.slug].delete,
                        resource_url.replace(service.api_root, ""),
                    ),
                )
                break

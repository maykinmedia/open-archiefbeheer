from collections.abc import Iterable
from typing import Mapping, NoReturn

from maykin_health_checks.types import HealthCheckResult

from openarchiefbeheer.external_registers.plugin import (
    AbstractBasePlugin,
    RelatedResourceList,
    ServiceSlug,
)
from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.external_registers.setup_configuration.models import (
    ExternalRegisterConfigurationModel,
)
from openarchiefbeheer.utils.results_store import (
    ResultStore,
)

from .constants import OBJECTEN_IDENTIFIER
from .setup_configuration.steps import ObjectenPluginConfigurartionStep


@register(OBJECTEN_IDENTIFIER)
class ObjectenPlugin(AbstractBasePlugin):
    verbose_name = "Objecten plugin"
    setup_configuration_model = ExternalRegisterConfigurationModel
    setup_configuration_step = ObjectenPluginConfigurartionStep

    def check_config(self) -> HealthCheckResult:
        # TODO
        pass

    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

    def get_related_resources(
        self, zaak_url: str
    ) -> Mapping[ServiceSlug, RelatedResourceList[dict]]:
        """Return the resources in the external register related to this zaak."""
        raise NotImplementedError()

    def delete_related_resources(
        self, zaak_url: str, related_resources: Iterable[str], result_store: ResultStore
    ) -> None | NoReturn:
        # TODO
        pass

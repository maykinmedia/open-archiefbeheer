from typing import Iterable, Mapping, NoReturn

from maykin_health_checks.types import HealthCheckResult

from openarchiefbeheer.external_registers.plugin import (
    AbstractBasePlugin,
    RelatedResourceList,
    ServiceSlug,
)
from openarchiefbeheer.external_registers.registry import register

from .models import OpenKlantConfig
from .setup_configuration.models import OpenKlantConfigurationModel


@register("openklant")
class OpenKlantPlugin(AbstractBasePlugin):
    verbose_name = "Open Klant plugin"
    config = OpenKlantConfig
    setup_configuration_model = OpenKlantConfigurationModel

    def check_config(self) -> HealthCheckResult:
        raise NotImplementedError()

    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

    def get_related_resources(
        self, zaak_url: str
    ) -> Mapping[ServiceSlug, RelatedResourceList[dict]]:
        """Return the resources in the external register related to this zaak."""
        raise NotImplementedError()

    def delete_related_resources(
        self, zaak_url: str, excluded_resources: Iterable[str]
    ) -> None | NoReturn:
        """Delete/Unlink the resources from the register that are related to the zaak.

        Raise an error if something goes wrong.
        """
        raise NotImplementedError()

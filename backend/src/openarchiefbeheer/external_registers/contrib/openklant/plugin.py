from openarchiefbeheer.external_registers.contrib.openklant.constants import (
    OPENKLANT_IDENTIFIER,
)
from openarchiefbeheer.external_registers.plugin import (
    AbstractBasePlugin,
)
from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.external_registers.setup_configuration.models import (
    ExternalRegisterConfigurationModel,
)

from .setup_configuration.steps import OpenKlantConfigurationStep


@register(OPENKLANT_IDENTIFIER)
class OpenKlantPlugin(AbstractBasePlugin):
    verbose_name = "Open Klant"
    resource_type = "onderwerpobjecten"
    setup_configuration_model = ExternalRegisterConfigurationModel
    setup_configuration_step = OpenKlantConfigurationStep

    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

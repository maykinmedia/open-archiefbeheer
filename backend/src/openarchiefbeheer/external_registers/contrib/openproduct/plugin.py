from openarchiefbeheer.external_registers.plugin import AbstractBasePlugin
from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.external_registers.setup_configuration.models import (
    ExternalRegisterConfigurationModel,
)

from .constants import OPENPRODUCT_IDENTIFIER
from .setup_configuration.steps import OpenProductConfigurationStep


@register(OPENPRODUCT_IDENTIFIER)
class OpenProductPlugin(AbstractBasePlugin):
    verbose_name = "Open Product"
    resource_type = "producten"
    setup_configuration_model = ExternalRegisterConfigurationModel
    setup_configuration_step = OpenProductConfigurationStep

    def get_admin_url(self, resource_url: str) -> str:
        # TODO should we just remove this method? It's not implemented in all plugins
        raise NotImplementedError()

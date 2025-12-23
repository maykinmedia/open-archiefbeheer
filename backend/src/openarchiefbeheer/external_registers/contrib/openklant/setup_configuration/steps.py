from openarchiefbeheer.external_registers.setup_configuration.steps import (
    ExternalRegisterPluginConfigurartionStep,
)

from ..constants import OPENKLANT_IDENTIFIER


class OpenKlantConfigurationStep(ExternalRegisterPluginConfigurartionStep):
    enable_setting = "openklant_enabled"
    namespace = "openklant"
    verbose_name = "OpenKlant Configuration"

    @property
    def plugin_identifier(self) -> str:
        return OPENKLANT_IDENTIFIER

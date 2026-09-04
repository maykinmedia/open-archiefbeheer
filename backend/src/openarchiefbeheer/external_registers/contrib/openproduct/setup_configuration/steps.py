from openarchiefbeheer.external_registers.setup_configuration.steps import (
    ExternalRegisterPluginConfigurartionStep,
)

from ..constants import OPENPRODUCT_IDENTIFIER


class OpenProductConfigurationStep(ExternalRegisterPluginConfigurartionStep):
    enable_setting = "openproduct_enabled"
    namespace = "openproduct"
    verbose_name = "Open Product Configuration"

    @property
    def plugin_identifier(self) -> str:
        return OPENPRODUCT_IDENTIFIER

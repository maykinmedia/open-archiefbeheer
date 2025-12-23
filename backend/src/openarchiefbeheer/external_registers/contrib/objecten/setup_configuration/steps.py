from openarchiefbeheer.external_registers.contrib.objecten.constants import (
    OBJECTEN_IDENTIFIER,
)
from openarchiefbeheer.external_registers.setup_configuration.steps import (
    ExternalRegisterPluginConfigurartionStep,
)


class ObjectenPluginConfigurartionStep(ExternalRegisterPluginConfigurartionStep):
    enable_setting = "objecten_enabled"
    namespace = "objecten"
    verbose_name = "Objecten Configuration"

    @property
    def plugin_identifier(self) -> str:
        return OBJECTEN_IDENTIFIER

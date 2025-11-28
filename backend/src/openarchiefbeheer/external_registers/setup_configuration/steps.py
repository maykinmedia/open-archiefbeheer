from django_setup_configuration import BaseConfigurationStep

from openarchiefbeheer.external_registers.registry import register

from .models import RegisterPluginConfigurationModel


class ExternalRegisterPluginsConfigurationStep(
    BaseConfigurationStep[RegisterPluginConfigurationModel]
):
    """Configure the settings of the external registers.

    Note: the order in which the settings are configured is not fixed. But the settings don't depend on each other,
    so this should be okay.
    """

    config_model = RegisterPluginConfigurationModel
    enable_setting = "external_registers_enabled"
    namespace = "external_registers"
    verbose_name = "External registers"

    def execute(self, model: RegisterPluginConfigurationModel) -> None:
        for plugin in register.iter_automatically_configurable():
            step = plugin.setup_configuration_step()
            plugin_config_data = getattr(model, plugin.identifier)
            step.execute(plugin.setup_configuration_model(**plugin_config_data))

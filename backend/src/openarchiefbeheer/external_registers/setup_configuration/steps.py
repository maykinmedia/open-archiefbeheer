from django_setup_configuration import BaseConfigurationStep, ConfigurationModel

from openarchiefbeheer.external_registers.registry import register

from .models import make_model_with_plugins


class ExternalRegisterPluginsConfigurationStep(
    BaseConfigurationStep[ConfigurationModel]
):
    """Configure the settings of the external registers.

    Note: the order in which the settings are configured is not fixed. But the settings don't depend on each other,
    so this should be okay.
    """

    config_model = make_model_with_plugins()
    enable_setting = "external_registers_enabled"
    namespace = "external_registers"
    verbose_name = "External registers"

    def execute(self, model: ConfigurationModel) -> None:
        for plugin in register.iter_automatically_configurable():
            step = plugin.setup_configuration_step()
            plugin_model = getattr(model, plugin.identifier)
            step.execute(plugin_model)

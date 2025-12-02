from django_setup_configuration import ConfigurationModel
from pydantic import create_model

from ..registry import register


def make_model_with_plugins() -> type[ConfigurationModel]:
    new_fields = {}
    for plugin in register.iter_automatically_configurable():
        new_fields[plugin.identifier] = (plugin.setup_configuration_model, None)

    return create_model(
        "ExternalRegisterPluginConfigurationModel",
        __base__=ConfigurationModel,
        **new_fields,
    )

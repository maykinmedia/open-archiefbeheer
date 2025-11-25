from typing import Any

from django_setup_configuration import ConfigurationModel
from django_setup_configuration.models import DjangoRefsMetaclass

from openarchiefbeheer.external_registers.registry import register


class PluginsRefMetaclass(DjangoRefsMetaclass):
    def __new__(
        cls,
        name: str,
        bases: tuple[type[Any], ...],
        namespace: dict[str, Any],
        *args,
        **kwargs: Any,
    ):
        annotations = namespace.setdefault("__annotations__", {})

        for plugin in register:
            namespace[plugin.identifier] = plugin.setup_configuration_model
            annotations[plugin.identifier] = object

        return super().__new__(cls, name, bases, namespace, *args, **kwargs)


class RegisterPluginConfigurationModel(
    ConfigurationModel, metaclass=PluginsRefMetaclass
):
    pass

from collections.abc import ItemsView
from typing import Callable, Iterator

from openarchiefbeheer.external_registers.plugin import AbstractBasePlugin


class Registry:
    _registry: dict[str, AbstractBasePlugin]

    def __init__(self) -> None:
        self._registry = {}

    def __call__[PluginT: AbstractBasePlugin](
        self, identifier: str
    ) -> Callable[[type[PluginT]], type[PluginT]]:
        def decorator(plugin_cls: type[PluginT]) -> type[PluginT]:
            if identifier in self._registry:
                raise ValueError(
                    f"The unique identifier '{identifier}' is already present "
                    "in the registry."
                )

            self._registry[identifier] = plugin_cls(identifier=identifier)
            return plugin_cls

        return decorator

    def iterate(self) -> ItemsView[str, AbstractBasePlugin]:
        return self._registry.items()

    def __getitem__(self, key: str) -> AbstractBasePlugin:
        return self._registry[key]

    def __contains__(self, key: str) -> bool:
        return key in self._registry

    def iter_automatically_configurable(self) -> Iterator[AbstractBasePlugin]:
        return (
            plugin
            for _identifier, plugin in self.iterate()
            if plugin.is_automatically_configurable
        )


register: Registry = Registry()

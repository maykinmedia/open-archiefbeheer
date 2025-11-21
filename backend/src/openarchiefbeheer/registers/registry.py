from typing import Callable, Iterator

from git import TYPE_CHECKING

if TYPE_CHECKING:
    from openarchiefbeheer.registers.plugin import AbstractBasePlugin


class Registry[PluginT: AbstractBasePlugin]:
    _registry: dict[str, PluginT]

    def __init__(self) -> None:
        self._registry = {}

    def __call__(self, identifier: str) -> Callable[[type[PluginT]], type[PluginT]]:
        def decorator(plugin_cls: type[PluginT]) -> type[PluginT]:
            if identifier in self._registry:
                raise ValueError(
                    f"The unique identifier '{identifier}' is already present "
                    "in the registry."
                )

            self._registry[identifier] = plugin_cls(identifier=identifier)
            return plugin_cls

        return decorator

    def __iter__(self) -> Iterator[PluginT]:
        return iter(self._registry.values())

    def __getitem__(self, key: str) -> PluginT:
        return self._registry[key]

    def __contains__(self, key: str) -> bool:
        return key in self._registry


register = Registry()

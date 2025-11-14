from abc import ABC, abstractmethod
from typing import Mapping, NoReturn, TypedDict, TypeVar

PluginConfig = TypeVar("PluginConfig")


class RelatedResourceList[T](TypedDict):
    next: str
    previous: str
    results: list[T]
    count: int


type ServiceSlug = str


class AbstractBasePlugin[PluginConfig, T](ABC):
    verbose_name: str
    """
    Specify the human-readable label for the plugin.
    """
    config: PluginConfig
    """
    Django solo model containing the configuration for the plugin.
    """

    def __init__(self, identifier: str):
        self.identifier = identifier

    def get_label(self) -> str:
        return self.verbose_name

    @abstractmethod
    def check_config(self) -> None | NoReturn:
        raise NotImplementedError()

    @abstractmethod
    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

    @abstractmethod
    def get_related_resources(
        self, zaak_url: str
    ) -> Mapping[ServiceSlug, RelatedResourceList[T]]:
        """Return the resources in the external register related to this zaak."""
        raise NotImplementedError()

    @abstractmethod
    def delete_resource(self, resource_url: str) -> None | NoReturn:
        """Delete the resource from the register.

        Raise an error if something goes wrong.
        """
        raise NotImplementedError()

    @abstractmethod
    def unlink_resource(self, resource_url: str, zaak_url: str) -> None | NoReturn:
        """Unlink the resource from the zaak.

        Raise an error if something goes wrong.
        """
        raise NotImplementedError()

from abc import ABC, abstractmethod
from typing import (
    Iterable,
    NoReturn,
    Protocol,
    TypedDict,
    TypeVar,
)

from django.utils.translation import gettext as _

from django_setup_configuration import BaseConfigurationStep, ConfigurationModel
from maykin_config_checks import HealthCheckResult
from zgw_consumers.models import Service

from openarchiefbeheer.utils.health_checks import CheckResult, ExtraInfo
from openarchiefbeheer.utils.results_store import ResultStore

from .models import ExternalRegisterConfig

type Identifier = str
type ServiceSlug = str
T = TypeVar("T", covariant=True)


class PluginConfig(Protocol):
    identifier: str
    enabled: bool
    services: Iterable[Service]


class RelatedResourceList[T](TypedDict):
    next: str
    previous: str
    results: list[T]
    count: int


class AbstractBasePlugin[T](ABC):
    identifier: Identifier
    verbose_name: str
    """
    Specify the human-readable label for the plugin.
    """
    setup_configuration_model: type[ConfigurationModel] | None = None
    setup_configuration_step: type[BaseConfigurationStep] | None = None

    def __init__(self, identifier: Identifier):
        self.identifier = identifier

    def get_label(self) -> str:
        return self.verbose_name

    def get_or_create_config(self) -> ExternalRegisterConfig:
        config, _created = ExternalRegisterConfig.objects.get_or_create(
            identifier=self.identifier
        )
        return config

    @property
    def is_automatically_configurable(self):
        return (
            self.setup_configuration_model is not None
            and self.setup_configuration_step is not None
        )

    def check_config(self) -> HealthCheckResult:
        config = self.get_or_create_config()
        if not config.enabled:
            return CheckResult(
                identifier=self.identifier,
                verbose_name=self.verbose_name,
                success=True,
                message=_("The {plugin_name} plugin is disabled.").format(
                    plugin_name=self.verbose_name
                ),
            )

        if not config.services.count() > 0:
            return CheckResult(
                identifier=self.identifier,
                verbose_name=self.verbose_name,
                success=False,
                message=_(
                    "No service(s) configured for the {plugin_name} plugin."
                ).format(plugin_name=self.verbose_name),
                extra=[
                    ExtraInfo(
                        code="missing_service",
                        model="openarchiefbeheer.external_registers.contrib.openklant.models.OpenKlantConfig",
                        field="services",
                    )
                ],
            )
        return CheckResult(
            identifier=self.identifier,
            verbose_name=self.verbose_name,
            success=True,
            message=_(
                "The {plugin_name} plugin settings are properly configured."
            ).format(plugin_name=self.verbose_name),
        )

    @abstractmethod
    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

    @abstractmethod
    def delete_related_resources(
        self, zaak_url: str, related_resources: Iterable[str], result_store: ResultStore
    ) -> None | NoReturn:
        """Delete/Unlink the resources from the register that are related to the zaak.

        Raise an error if something goes wrong.
        """
        raise NotImplementedError()

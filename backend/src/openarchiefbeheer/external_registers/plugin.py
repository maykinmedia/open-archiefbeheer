from __future__ import annotations

from abc import ABC, abstractmethod
from collections import defaultdict
from typing import (
    TYPE_CHECKING,
    Iterable,
)

from django.db.models.functions import Length
from django.utils.translation import gettext as _

from zgw_consumers.client import build_client

from openarchiefbeheer.utils.health_checks import CheckResult, ExtraInfo

from ..destruction.constants import ResourceDestructionResultStatus
from .models import ExternalRegisterConfig

type Identifier = str
type ResourceURL = str

if TYPE_CHECKING:
    from ape_pie import APIClient
    from django_setup_configuration import BaseConfigurationStep, ConfigurationModel
    from maykin_config_checks import HealthCheckResult
    from requests import Response
    from zgw_consumers.models import Service

    from openarchiefbeheer.destruction.models import DestructionListItem


class AbstractBasePlugin(ABC):
    identifier: Identifier
    verbose_name: str
    resource_type: str
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
    def is_automatically_configurable(self) -> bool:
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

        if not config.services.exists():
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
                        model="openarchiefbeheer.external_registers.models.ExternalRegisterConfig",
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

    def delete_related_resources(
        self, item: DestructionListItem, related_resources: Iterable[ResourceURL]
    ) -> None:
        """
        Delete/Unlink the resources from the register that are related to the zaak.

        Default implementation of deleting the list of related resources
        Raise an error if something goes wrong.
        """
        from openarchiefbeheer.destruction.models import ResourceDestructionResult

        resources_by_service = self.group_resources_by_service(related_resources)

        for service, resources in resources_by_service.items():
            client = build_client(service)

            for resource_url in resources:
                response = self.delete_related_resource(resource_url, client, item)

                if response.status_code != 404:
                    response.raise_for_status()

                status_resource = (
                    ResourceDestructionResultStatus.deleted
                    if response.status_code == 204
                    else ResourceDestructionResultStatus.unlinked
                )

                ResourceDestructionResult.objects.create(
                    item=item,
                    resource_type=self.resource_type,
                    url=resource_url,
                    status=status_resource,
                )

    def group_resources_by_service(
        self, related_resources: Iterable[ResourceURL]
    ) -> dict[Service, Iterable[ResourceURL]]:
        """
        group all related_resources urls by related services
        """
        config = self.get_or_create_config()

        services = list(
            config.services.all()
            .annotate(api_root_length=Length("api_root"))
            .order_by("-api_root_length")
        )

        resources_by_service = defaultdict(list)

        for resource_url in related_resources:
            service = next(
                (
                    service
                    for service in services
                    if resource_url.startswith(service.api_root)
                ),
                None,
            )

            if service is None:
                continue

            resources_by_service[service].append(resource_url)
        return resources_by_service

    @staticmethod
    def delete_related_resource(
        resource_url: ResourceURL, client: APIClient, item: DestructionListItem
    ) -> Response:
        return client.delete(resource_url)

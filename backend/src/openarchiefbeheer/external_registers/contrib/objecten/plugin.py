from collections.abc import Iterable
from typing import NoReturn

from ape_pie import APIClient
from requests import Response

from openarchiefbeheer.destruction.models import (
    DestructionListItem,
)
from openarchiefbeheer.external_registers.plugin import (
    AbstractBasePlugin,
)
from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.external_registers.setup_configuration.models import (
    ExternalRegisterConfigurationModel,
)

from .constants import OBJECTEN_IDENTIFIER
from .setup_configuration.steps import ObjectenPluginConfigurartionStep


@register(OBJECTEN_IDENTIFIER)
class ObjectenPlugin(AbstractBasePlugin):
    verbose_name = "Objecten"
    resource_type = "objecten"
    setup_configuration_model = ExternalRegisterConfigurationModel
    setup_configuration_step = ObjectenPluginConfigurartionStep

    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

    @staticmethod
    def delete_related_resource(
        resource_url: str, client: APIClient, item: DestructionListItem
    ) -> Response:
        return client.delete(
            resource_url,
            params={"zaak": item.zaak.url},
        )

    def delete_related_resources(
        self, item: DestructionListItem, related_resources: Iterable[str]
    ) -> None | NoReturn:
        assert item.zaak

        super().delete_related_resources(item, related_resources)

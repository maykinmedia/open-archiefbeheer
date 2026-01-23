from collections.abc import Iterable
from typing import NoReturn

from django.db.models.functions import Length

from zgw_consumers.client import build_client

from openarchiefbeheer.destruction.constants import ResourceDestructionResultStatus
from openarchiefbeheer.destruction.models import (
    DestructionListItem,
    ResourceDestructionResult,
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
    setup_configuration_model = ExternalRegisterConfigurationModel
    setup_configuration_step = ObjectenPluginConfigurartionStep

    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

    def delete_related_resources(
        self, item: DestructionListItem, related_resources: Iterable[str]
    ) -> None | NoReturn:
        config = self.get_or_create_config()
        services_candidates = (
            config.services.all()
            .annotate(api_root_length=Length("api_root"))
            .order_by("-api_root_length")
        )
        clients = {
            service.slug: build_client(service) for service in services_candidates
        }

        for resource_url in related_resources:
            for service in services_candidates:
                if not resource_url.startswith(service.api_root):
                    continue

                response = clients[service.slug].delete(
                    resource_url.replace(service.api_root, "")
                )
                if response.status_code != 204 or response.status_code != 404:
                    response.raise_for_status()

                ResourceDestructionResult.objects.create(
                    item=item,
                    resource_type="objecten",
                    url=resource_url,
                    status=ResourceDestructionResultStatus.deleted,
                )
                break

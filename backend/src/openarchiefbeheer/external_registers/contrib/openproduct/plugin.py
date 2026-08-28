from collections.abc import Iterable

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

from .constants import OPENPRODUCT_IDENTIFIER
from .setup_configuration.steps import OpenProductConfigurationStep


@register(OPENPRODUCT_IDENTIFIER)
class OpenProductPlugin(AbstractBasePlugin):
    verbose_name = "Open Product"
    setup_configuration_model = ExternalRegisterConfigurationModel
    setup_configuration_step = OpenProductConfigurationStep

    def get_admin_url(self, resource_url: str) -> str:
        # TODO should we just remove this method? It's not implemented in all plugins
        raise NotImplementedError()

    def delete_related_resources(
        self, item: DestructionListItem, related_resources: Iterable[str]
    ) -> None:

        config = self.get_or_create_config()
        services_candidates = (
            config.services.all()
            .annotate(api_root_length=Length("api_root"))
            .order_by("-api_root_length")
        )
        clients = {
            service.slug: build_client(service) for service in services_candidates
        }

        # delete all resources linked with zaakobjecten with type = 'product'
        for resource_url in related_resources:
            for service in services_candidates:
                if not resource_url.startswith(service.api_root):
                    continue

                response = clients[service.slug].delete(
                    resource_url.replace(service.api_root, ""),
                )
                if response.status_code != 404:
                    response.raise_for_status()

                status_resource = (
                    ResourceDestructionResultStatus.deleted
                    if response.status_code == 204
                    else ResourceDestructionResultStatus.unlinked
                )

                ResourceDestructionResult.objects.create(
                    item=item,
                    resource_type="producten",
                    url=resource_url,
                    status=status_resource,
                )
                break

        # TODO products not coupled via zaakobjecten, using product.aanvraag_zaak_url

from collections.abc import Iterable
from functools import partial
from typing import NoReturn

from django.db.models.functions import Length

from zgw_consumers.client import build_client

from openarchiefbeheer.external_registers.contrib.openklant.constants import (
    OPENKLANT_IDENTIFIER,
)
from openarchiefbeheer.external_registers.plugin import (
    AbstractBasePlugin,
)
from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.external_registers.setup_configuration.models import (
    ExternalRegisterConfigurationModel,
)
from openarchiefbeheer.utils.results_store import (
    ResultStore,
    delete_object_and_store_result,
)

from .setup_configuration.steps import OpenKlantConfigurationStep


@register(OPENKLANT_IDENTIFIER)
class OpenKlantPlugin(AbstractBasePlugin):
    verbose_name = "Open Klant"
    setup_configuration_model = ExternalRegisterConfigurationModel
    setup_configuration_step = OpenKlantConfigurationStep

    def get_admin_url(self, resource_url: str) -> str:
        """From the URL of the resource in the API, return the URL to the resource in the admin of the register."""
        raise NotImplementedError()

    def delete_related_resources(
        self, zaak_url: str, related_resources: Iterable[str], result_store: ResultStore
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

                delete_object_and_store_result(
                    result_store,
                    "onderwerpobjecten",
                    resource_url,
                    partial(
                        clients[service.slug].delete,
                        resource_url.replace(service.api_root, ""),
                    ),
                )
                break

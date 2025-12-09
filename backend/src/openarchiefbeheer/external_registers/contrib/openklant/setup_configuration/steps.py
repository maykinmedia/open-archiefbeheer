from django_setup_configuration import BaseConfigurationStep
from django_setup_configuration.exceptions import ConfigurationRunFailed
from zgw_consumers.models import Service

from openarchiefbeheer.external_registers.registry import register as registry
from openarchiefbeheer.external_registers.setup_configuration.models import (
    ExternalRegisterConfigurationModel,
)

from ..constants import OPENKLANT_IDENTIFIER


class OpenKlantConfigurationStep(
    BaseConfigurationStep[ExternalRegisterConfigurationModel]
):
    config_model = ExternalRegisterConfigurationModel
    enable_setting = "openklant_enabled"
    namespace = "openklant"
    verbose_name = "OpenKlant Configuration"

    def execute(self, model: ExternalRegisterConfigurationModel) -> None:
        config = registry[OPENKLANT_IDENTIFIER].get_or_create_config()

        config.enabled = model.enabled
        existing_services = Service.objects.filter(
            slug__in=model.services_identifiers
        ).values_list("slug", "id")
        if existing_services.count():
            existing_services_slugs, existing_services_ids = zip(
                *existing_services, strict=True
            )
        else:
            existing_services_slugs = existing_services_ids = set()

        missing_services_slugs = set(model.services_identifiers) - set(
            existing_services_slugs
        )
        if missing_services_slugs:
            raise ConfigurationRunFailed(
                f"Missing services with slugs: {', '.join(sorted(missing_services_slugs))}."
                " Make sure they are already configured, manually or by first running the "
                "configuration step of `zgw_consumers`."
            )

        config.services.add(*existing_services_ids)
        config.save()

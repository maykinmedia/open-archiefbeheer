from django_setup_configuration import BaseConfigurationStep
from django_setup_configuration.exceptions import ConfigurationRunFailed
from zgw_consumers.models import Service

from ..models import OpenKlantConfig
from .models import OpenKlantConfigurationModel


class OpenKlantConfigurationStep(BaseConfigurationStep[OpenKlantConfigurationModel]):
    config_model = OpenKlantConfigurationModel
    enable_setting = "openklant_enabled"
    namespace = "openklant"
    verbose_name = "OpenKlant Configuration"

    def execute(self, model: OpenKlantConfigurationModel) -> None:
        config = OpenKlantConfig.get_solo()

        config.enabled = model.enabled
        services = Service.objects.filter(slug__in=model.services_identifiers)
        if services.count() != len(model.services_identifiers):
            raise ConfigurationRunFailed(
                "Could not find all the services specified."
                " Make sure they are already configured, manually or by first running the "
                "configuration step of `zgw_consumers`."
            )

        config.services.add(*services.values_list("id", flat=True))
        config.save()

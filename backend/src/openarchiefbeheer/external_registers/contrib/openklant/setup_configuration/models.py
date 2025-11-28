from django_setup_configuration import ConfigurationModel
from django_setup_configuration.fields import DjangoModelRef

from ..models import OpenKlantConfig


class OpenKlantConfigurationModel(ConfigurationModel):
    enabled: bool = DjangoModelRef(OpenKlantConfig, "enabled")
    services_identifiers: list[str] = DjangoModelRef(OpenKlantConfig, "services")

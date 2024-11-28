from django_setup_configuration import BaseConfigurationStep
from zgw_consumers.models import Service

from ..models import APIConfig
from .models import APIConfigConfigurationModel


def get_service(slug: str) -> Service:
    """
    Try to find a Service and re-raise DoesNotExist with the identifier to make debugging
    easier
    """
    try:
        return Service.objects.get(slug=slug)
    except Service.DoesNotExist as e:
        raise Service.DoesNotExist(f"{str(e)} (identifier = {slug})")


class APIConfigConfigurationStep(BaseConfigurationStep[APIConfigConfigurationModel]):
    """Configure API settings"""

    config_model = APIConfigConfigurationModel
    enable_setting = "api_configuration_enabled"
    namespace = "api_configuration"
    verbose_name = "API Configuration"

    def execute(self, model: APIConfigConfigurationModel) -> None:
        service = get_service(model.selectielijst_service_identifier)

        config = APIConfig.get_solo()

        # Idempotent configuration
        if (
            config.selectielijst_api_service
            and service.pk == config.selectielijst_api_service.pk
        ):
            return

        config.selectielijst_api_service = service
        config.save()

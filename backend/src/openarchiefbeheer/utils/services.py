from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from .exceptions import NoServiceConfigured


def get_service(service_type: APITypes) -> Service:
    service = Service.objects.filter(api_type=service_type).first()
    if not service:
        raise NoServiceConfigured(f"No service configured of type {service_type}.")
    return service

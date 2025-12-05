import logging

from zgw_consumers.models import Service

from .plugin import AbstractBasePlugin
from .registry import register as registry

logger = logging.getLogger(__name__)


def get_plugin_for_related_object(related_object_url: str) -> AbstractBasePlugin | None:
    service = Service.get_service(related_object_url)

    if service is None:
        return

    configs = service.externalregisterconfig_set.all()
    if (count := configs.count()) == 0:
        return
    elif count > 1:
        logger.error("Multiple configurations reference the same service.")

    config = configs.first()
    return registry[config.identifier]

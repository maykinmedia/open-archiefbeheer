import structlog
from zgw_consumers.models import Service

from .plugin import AbstractBasePlugin
from .registry import register as registry

logger = structlog.stdlib.get_logger(__name__)


def get_plugin_for_related_object(related_object_url: str) -> AbstractBasePlugin | None:
    service = Service.get_service(related_object_url)

    if service is None:
        return

    configs = service.externalregisterconfig_set.all()
    if (count := configs.count()) == 0:
        return
    elif count > 1:
        logger.error("multiple_service_configurations")

    config = configs.first()
    return registry[config.identifier]

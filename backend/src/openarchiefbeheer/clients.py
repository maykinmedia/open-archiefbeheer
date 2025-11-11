from functools import lru_cache
from typing import NoReturn

from django.core.exceptions import ImproperlyConfigured
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

from ape_pie import APIClient
from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from openarchiefbeheer.config.models import APIConfig


@lru_cache
def get_service_from_url(url: str) -> Service | None:
    return Service.get_service(url)


def _get_client(api_type: APITypes, slug: str = "") -> APIClient | NoReturn:
    services = Service.objects.filter(api_type=APITypes.ztc)
    if slug:
        services = services.filter(slug=slug)

    if not (service := services.first()):
        raise ImproperlyConfigured(
            _("No {formatted_api_type} service configured").format(
                formatted_api_type=api_type.upper()
            )
        )

    return build_client(service)


@lru_cache
def ztc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured ZTC service

    The empty slug `""` wil return whatever the "first" is if it exists.
    """
    client = _get_client(APITypes.ztc, slug)
    # passing as arg to build_client doesn't work
    client.headers["Accept-Crs"] = "EPSG:4326"
    return client


@lru_cache
def zrc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured ZRC service

    The empty slug `""` wil return whatever the "first" is if it exists.
    """
    return _get_client(APITypes.zrc, slug)


@lru_cache
def drc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured DRC service

    The empty slug `""` wil return whatever the "first" is if it exists.
    """
    return _get_client(APITypes.drc, slug)


@lru_cache
def brc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured DRC service

    The empty slug `""` wil return whatever the "first" is if it exists.
    """
    return _get_client(APITypes.brc, slug)


@lru_cache
def selectielijst_client() -> APIClient | NoReturn:
    config = APIConfig.get_solo()

    if config.selectielijst_api_service is None:
        raise ImproperlyConfigured(_("No Selectielijst service configured"))

    return build_client(config.selectielijst_api_service)


@receiver([post_delete, post_save], sender=Service, weak=False)
def clear_cache_on_service_change(sender, instance, **_):
    get_service_from_url.cache_clear()
    ztc_client.cache_clear()
    zrc_client.cache_clear()
    drc_client.cache_clear()
    brc_client.cache_clear()
    selectielijst_client.cache_clear()


@receiver([post_delete, post_save], sender=APIConfig, weak=False)
def clear_cache_on_api_config_change(sender, instance, **_):
    selectielijst_client.cache_clear()

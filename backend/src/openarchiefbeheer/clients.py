import hashlib
from functools import lru_cache
from typing import Callable, NoReturn, TypeVar

from django.core.cache import cache as django_cache
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
    """Return an APIClient of the requested type.

    The empty slug `""` wil return whatever the "first" is if it exists."""
    services = Service.objects.filter(api_type=api_type)
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
    """Return the APIClient for the configured ZTC service"""
    client = _get_client(APITypes.ztc, slug)
    # passing as arg to build_client doesn't work
    client.headers["Accept-Crs"] = "EPSG:4326"
    return client


@lru_cache
def zrc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured ZRC service"""
    return _get_client(APITypes.zrc, slug)


@lru_cache
def drc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured DRC service"""
    return _get_client(APITypes.drc, slug)


@lru_cache
def brc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured DRC service"""
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


R = TypeVar("R", covariant=True)


def _cached_with_args(f: Callable[..., R]) -> Callable[..., R]:
    def wrapped_f(*args: str) -> R:
        # Cannot use the args directly, because they include URLs and the keys shouldn't be longer than 250 chars
        key = hashlib.md5(
            "+".join([f.__qualname__, *args]).encode(), usedforsecurity=False
        ).hexdigest()

        sentinel = object()
        result = django_cache.get(key, sentinel)
        if result is not sentinel:
            return result

        result = f(*args)
        django_cache.set(key, result)
        return result

    return wrapped_f


def _cached[F: Callable[[], object]](f: F) -> F:
    key = f.__qualname__
    function: F = lambda: django_cache.get_or_set(
        # type: ignore get_or_set annotation is bad
        key,
        default=f,
        timeout=60 * 60 * 24,
    )
    function.clear_cache = lambda: django_cache.delete(
        key
    )  # pyright: ignore[reportFunctionMemberAccess]

    return function

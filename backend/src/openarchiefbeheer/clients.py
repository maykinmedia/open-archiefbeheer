import hashlib
from functools import cache, lru_cache
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


@lru_cache
def _get_service(api_type: APITypes, slug: str = "") -> Service | NoReturn:
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

    return service


def ztc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured ZTC service"""
    service = _get_service(APITypes.ztc, slug)
    client = build_client(service)
    # passing as arg to build_client doesn't work
    client.headers["Accept-Crs"] = "EPSG:4326"
    return client


def zrc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured ZRC service"""
    service = _get_service(APITypes.zrc, slug)
    return build_client(service)


def drc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured DRC service"""
    service = _get_service(APITypes.drc, slug)
    return build_client(service)


def brc_client(slug: str = "") -> APIClient | NoReturn:
    """Return the APIClient for the configured BRC service"""
    service = _get_service(APITypes.brc, slug)
    return build_client(service)


@cache
def _get_selectielijst_service() -> Service | NoReturn:
    config = APIConfig.get_solo()

    if config.selectielijst_api_service is None:
        raise ImproperlyConfigured(_("No Selectielijst service configured"))

    return config.selectielijst_api_service


def selectielijst_client() -> APIClient | NoReturn:
    return build_client(_get_selectielijst_service())


@receiver([post_delete, post_save], sender=Service, weak=False)
def clear_cache_on_service_change(sender, instance, **_):
    get_service_from_url.cache_clear()
    _get_service.cache_clear()
    _get_selectielijst_service.cache_clear()


@receiver([post_delete, post_save], sender=APIConfig, weak=False)
def clear_cache_on_api_config_change(sender, instance, **_):
    _get_selectielijst_service.cache_clear()


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
    function.clear_cache = lambda: django_cache.delete(  # pyright: ignore[reportFunctionMemberAccess] # noqa
        key
    )

    return function

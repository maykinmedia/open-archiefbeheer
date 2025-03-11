import logging

from decouple import Csv, config as _config, undefined
from sentry_sdk.integrations import DidNotEnable, django, redis

logger = logging.getLogger(__name__)


def config(option: str, default=undefined, *args, **kwargs):
    """
    Pull a config parameter from the environment.

    Read the config variable ``option``. If it's optional, use the ``default`` value.
    Input is automatically cast to the correct type, where the type is derived from the
    default value if possible.

    Pass ``split=True`` to split the comma-separated input into a list.
    """
    if "split" in kwargs:
        kwargs.pop("split")
        csv_kwargs = {}
        if csv_cast := kwargs.pop("csv_cast", None):
            csv_kwargs.update({"cast": csv_cast})
        kwargs["cast"] = Csv(**csv_kwargs)
        if default == []:
            default = ""

    if default is not undefined and default is not None:
        kwargs.setdefault("cast", type(default))
    return _config(option, default=default, *args, **kwargs)


def get_sentry_integrations() -> list:
    """
    Determine which Sentry SDK integrations to enable.
    """
    default = [
        django.DjangoIntegration(),
        redis.RedisIntegration(),
    ]
    extra = []

    try:
        from sentry_sdk.integrations import celery
    except DidNotEnable:  # happens if the celery import fails by the integration
        pass
    else:
        extra.append(celery.CeleryIntegration())

    return [*default, *extra]


def get_git_sha() -> str:
    from git import InvalidGitRepositoryError, Repo

    try:
        # in docker (build) context, there is no .git directory
        repo = Repo(search_parent_directories=True)
    except InvalidGitRepositoryError:
        return ""

    try:
        return repo.head.object.hexsha
    except (
        ValueError
    ):  # on startproject initial runs before any git commits have been made
        return repo.active_branch.name


def get_release() -> str:
    from git import InvalidGitRepositoryError, Repo

    try:
        # in docker (build) context, there is no .git directory
        repo = Repo(search_parent_directories=True)
    except InvalidGitRepositoryError:
        return ""

    if not len(repo.tags):
        return ""

    current_tag = next(
        (tag for tag in repo.tags if tag.commit == repo.head.commit), None
    )
    return current_tag.name if current_tag else ""

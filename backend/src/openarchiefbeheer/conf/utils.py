import logging  # noqa: TID251 - only used for the log levels

from sentry_sdk.integrations import DidNotEnable, django, redis
from sentry_sdk.integrations.logging import LoggingIntegration


def get_sentry_integrations() -> list:
    """
    Determine which Sentry SDK integrations to enable.
    """
    default = [
        django.DjangoIntegration(),
        LoggingIntegration(
            level=logging.INFO,  # breadcrumbs
            # do not send any logs as event to Sentry at all - these must be scraped by
            # the (container) infrastructure instead.
            event_level=None,
        ),
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

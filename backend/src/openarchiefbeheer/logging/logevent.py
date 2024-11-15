import traceback

from django.db.models import Model

from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.api.serializers import UserSerializer
from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.destruction.models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListReview,
    ReviewDecisionChoices,
)


def _create_log(
    model: Model, event: str, extra_data: dict | None = None, user: User | None = None
) -> TimelineLog:
    if user:
        serializer = UserSerializer(user)
        user_groups = [group.name for group in user.groups.all()]
        extra_data.update({"user": serializer.data, "user_groups": user_groups})

    return TimelineLog.objects.create(
        content_object=model,
        template=f"logging/{event}.txt",
        extra_data=extra_data or {},
        user=user,
    )


def destruction_list_created(
    destruction_list: DestructionList, author: User, reviewer: User
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_created",
        user=author,
        extra_data={
            "pk": destruction_list.pk,
            "name": destruction_list.name,
            "reviewer": {
                "pk": reviewer.pk,
                "email": reviewer.email,
                "username": reviewer.username,
            },
        },
    )


def destruction_list_updated(destruction_list: DestructionList, user: User) -> None:
    _create_log(model=destruction_list, event="destruction_list_updated", user=user)


def destruction_list_reassigned(
    destruction_list: DestructionList,
    assignee: DestructionListAssignee,
    comment: str,
    user: User,
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_reassigned",
        user=user,
        extra_data={
            "assignee": {
                "user": {
                    "pk": assignee.user.pk,
                    "email": assignee.user.email,
                    "username": assignee.user.username,
                },
            },
            "comment": comment,
        },
    )


def destruction_list_co_reviewers_added(
    destruction_list: DestructionList,
    added_co_reviewers: list[dict],
    removed_co_reviewers: list[dict],
    partial: bool,
    comment: str,
    user: User,
):
    _create_log(
        model=destruction_list,
        event="destruction_list_co_reviewers_added",
        user=user,
        extra_data={
            "added_co_reviewers": [
                co_reviewer["user"].get_name_with_username()
                for co_reviewer in added_co_reviewers
            ],
            "removed_co_reviewers": [
                co_reviewer["user"].get_name_with_username()
                for co_reviewer in removed_co_reviewers
            ],
            "partial": partial,
            "comment": comment,
        },
    )


def destruction_list_reviewed(
    destruction_list: DestructionList, review: DestructionListReview, user: User
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_reviewed",
        user=user,
        extra_data={"approved": review.decision == ReviewDecisionChoices.accepted},
    )


def destruction_list_finalized(
    destruction_list: DestructionList,
    comment: str,
    archivist: User,
    record_manager: User,
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_finalized",
        user=record_manager,
        extra_data={
            "pk": destruction_list.pk,
            "name": destruction_list.name,
            "comment": comment,
            "archivist": {
                "pk": archivist.pk,
                "email": archivist.email,
                "username": archivist.username,
            },
        },
    )


def destruction_list_aborted(
    destruction_list: DestructionList,
    comment: str,
    record_manager: User,
):
    _create_log(
        model=destruction_list,
        event="destruction_list_aborted",
        user=record_manager,
        extra_data={
            "comment": comment,
        },
    )


def resync_started() -> None:
    return TimelineLog.objects.create(
        template="logging/resync_started.txt",
    )


def resync_successful() -> None:
    return TimelineLog.objects.create(
        template="logging/resync_successful.txt",
    )


def resync_failed(exc: Exception) -> None:
    error = traceback.format_exception_only(exc)[0]

    return TimelineLog.objects.create(
        template="logging/resync_failed.txt", extra_data={"error": error}
    )

from django.db.models import Model

from timeline_logger.models import TimelineLog

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
    return TimelineLog.objects.create(
        content_object=model,
        template=f"logging/{event}.txt",
        extra_data=extra_data,
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

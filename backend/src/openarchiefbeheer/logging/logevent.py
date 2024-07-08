from django.db.models import Model

from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.destruction.constants import ListRole
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


def destruction_list_created(destruction_list: DestructionList, user: User) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_created",
        user=user,
        extra_data={
            "pk": destruction_list.pk,
            "name": destruction_list.name,
            "author": {
                "pk": destruction_list.author.pk,
                "email": destruction_list.author.email,
                "username": destruction_list.author.username,
            },
            "assignees": [
                {
                    "user": {
                        "pk": assignee.user.pk,
                        "email": assignee.user.email,
                        "username": assignee.user.username,
                    },
                }
                for assignee in destruction_list.assignees.exclude(role=ListRole.author)
            ],
        },
    )


def destruction_list_updated(destruction_list: DestructionList) -> None:
    _create_log(model=destruction_list, event="destruction_list_updated")


def destruction_list_reassigned(
    destruction_list: DestructionList,
    assignees: list[DestructionListAssignee],
    comment: str,
    user: User,
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_reassigned",
        user=user,
        extra_data={
            "assignees": [
                {
                    "user": {
                        "pk": assignee["user"].pk,
                        "email": assignee["user"].email,
                        "username": assignee["user"].username,
                    },
                }
                for assignee in assignees
            ],
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

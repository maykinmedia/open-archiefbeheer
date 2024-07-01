from django.db.models import Model

from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.destruction.models import (
    DestructionList,
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
    _create_log(model=destruction_list, event="destruction_list_created", user=user)


def destruction_list_updated(destruction_list: DestructionList) -> None:
    _create_log(model=destruction_list, event="destruction_list_updated")


def destruction_list_reviewed(
    destruction_list: DestructionList, review: DestructionListReview, user: User
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_reviewed",
        user=user,
        extra_data={"approved": review.decision == ReviewDecisionChoices.accepted},
    )

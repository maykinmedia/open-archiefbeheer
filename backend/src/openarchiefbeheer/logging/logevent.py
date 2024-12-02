import traceback

from django.db.models import Max, Min, Model

from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.api.serializers import UserSerializer
from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.destruction.models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListCoReview,
    DestructionListReview,
    ReviewDecisionChoices,
)
from openarchiefbeheer.zaken.utils import (
    format_resultaten_choices,
    format_zaaktype_choices,
)

TEMPLATE_FORMAT = "logging/%(event)s.txt"


def _create_log(
    model: Model, event: str, extra_data: dict | None = None, user: User | None = None
) -> TimelineLog:
    if extra_data is None:
        # Making sure extra_data is always a dict to prevent NoneType errors
        extra_data = {}

    if user:
        serializer = UserSerializer(user)
        user_groups = sorted([group.name for group in user.groups.all()])
        extra_data.update({"user": serializer.data, "user_groups": user_groups})

    return TimelineLog.objects.create(
        content_object=model,
        template=TEMPLATE_FORMAT % {"event": event},
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


def destruction_list_ready_for_first_review(
    destruction_list: DestructionList, user: User
) -> None:

    extra_data = {
        "zaaktypen": format_zaaktype_choices(
            destruction_list.items.distinct("zaak__zaaktype").values_list(
                "zaak___expand__zaaktype", flat=True
            )
        ),
        "resultaten": format_resultaten_choices(
            destruction_list.items.distinct("zaak__resultaat")
            .values_list("zaak___expand__resultaat", flat=True)
            .distinct()
        ),
        "archiefnominaties": list(
            destruction_list.items.distinct("zaak__archiefnominatie").values_list(
                "zaak__archiefnominatie", flat=True
            )
        ),
        "comment": destruction_list.comment,
        "number_of_zaken": destruction_list.items.count(),
    }

    items_max_min = destruction_list.items.aggregate(
        Min("zaak__archiefactiedatum"), Max("zaak__archiefactiedatum")
    )
    if archiefactiedatum_min := items_max_min.get("zaak__archiefactiedatum__min"):
        extra_data["min_archiefactiedatum"] = archiefactiedatum_min

    if archiefactiedatum_max := items_max_min.get("zaak__archiefactiedatum__max"):
        extra_data["max_archiefactiedatum"] = archiefactiedatum_max

    _create_log(
        model=destruction_list,
        event="destruction_list_ready_for_first_review",
        user=user,
        extra_data=extra_data,
    )


def destruction_list_review_response_created(
    destruction_list: DestructionList, user: User
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_review_response_created",
        user=user,
    )


def destruction_list_review_response_processed(
    destruction_list: DestructionList,
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_review_response_processed",
        extra_data={
            "number_of_zaken": destruction_list.items.filter(
                status=ListItemStatus.suggested
            ).count(),
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


def destruction_list_co_reviewed(
    destruction_list: DestructionList, co_review: DestructionListCoReview, user: User
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_co_reviewed",
        user=user,
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
    abort_destruction: bool,
):
    _create_log(
        model=destruction_list,
        event="destruction_list_aborted",
        user=record_manager,
        extra_data={
            "comment": comment,
            "abort_destruction": abort_destruction,
        },
    )


def destruction_list_deletion_triggered(
    destruction_list: DestructionList,
    record_manager: User,
) -> None:
    _create_log(
        model=destruction_list,
        event="destruction_list_deletion_triggered",
        user=record_manager,
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

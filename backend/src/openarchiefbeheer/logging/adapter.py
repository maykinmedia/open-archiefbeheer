from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Mapping

from django.db.models import Max, Min

from timeline_logger.typing import EventDetailsProtocol

from openarchiefbeheer.destruction.constants import ListItemStatus

from .utils import get_event_template

if TYPE_CHECKING:
    from django.contrib.auth.models import AnonymousUser
    from django.db import models

    from structlog.typing import EventDict

    from openarchiefbeheer.accounts.models import User


@dataclass(slots=True, frozen=True, kw_only=True)
class EventDetails(EventDetailsProtocol["User"]):
    event: str
    """
    Canonical event name of the thing that happened.
    """
    instance: models.Model | None = None
    """
    Main database object this log event is about.
    """
    extra_data: Mapping[str, object] | None = None
    """
    Additional data to store in the extra_data JSON field.
    """
    user: User | AnonymousUser | None = None
    """
    The current user that triggerd the log event.
    """
    error: Exception | str = ""
    """
    Any relevant Python exception to include in the log record.
    """

    def get_template_name(self) -> str:
        return get_event_template(self.event)

    def get_user(self) -> User | None:
        from openarchiefbeheer.accounts.models import User

        # If user is not authenticated (eg. AnonymousUser) we can not
        # save it on the TimelineLog model
        if self.user and self.user.is_authenticated:
            assert isinstance(self.user, User)
            return self.user
        return None

    def get_extra_data(self) -> Mapping[str, object]:
        from openarchiefbeheer.accounts.api.serializers import UserSerializer

        extra_data: dict[str, object] = {"log_event": self.event}
        if self.extra_data:
            extra_data |= self.extra_data

        if self.error:
            extra_data["error"] = str(self.error)

        if self.user:
            extra_data["user"] = UserSerializer(self.user).data
            extra_data["user_groups"] = sorted(
                [group.name for group in self.user.groups.all()]
            )

        return extra_data


def from_structlog(event_dict: EventDict) -> EventDetails:  # noqa: C901
    """
    Transform structlog events into django-timeline-logger parameters.
    """
    from openarchiefbeheer.accounts.models import User
    from openarchiefbeheer.destruction.models import (
        DestructionList,
        DestructionListItem,
    )
    from openarchiefbeheer.zaken.utils import (
        format_resultaten_choices,
        format_zaaktype_choices,
    )

    assert "event" in event_dict
    match event_dict:
        case {
            "event": "destruction_list_review_response_created"
            | "destruction_list_updated"
            | "destruction_list_co_reviewed"
            | "destruction_list_deletion_triggered" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "user": str(username),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            user = User.objects.get(username=username)
            return EventDetails(
                event=event,
                instance=destruction_list,
                user=user,
            )

        case {
            "event": "destruction_list_created" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "author": str(author),
            "reviewer": str(reviewer),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            user = User.objects.get(username=author)
            reviewer = User.objects.get(username=reviewer)
            return EventDetails(
                event=event,
                instance=destruction_list,
                user=user,
                extra_data={
                    "destruction_list_pk": destruction_list.pk,
                    "destruction_list_name": destruction_list.name,
                    "reviewer": {
                        "pk": reviewer.pk,
                        "email": reviewer.email,
                        "username": reviewer.username,
                    },
                },
            )

        case {
            "event": "destruction_list_ready_for_first_review" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "user": str(username),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            user = User.objects.get(username=username)

            extra_data = {
                "zaaktypen": format_zaaktype_choices(
                    destruction_list.items.order_by(
                        "zaak___expand__zaaktype__identificatie",
                        "-zaak___expand__zaaktype__versiedatum",
                    )
                    .distinct("zaak___expand__zaaktype__identificatie")
                    .values_list("zaak___expand__zaaktype", flat=True)
                ),
                "resultaten": format_resultaten_choices(
                    destruction_list.items.distinct("zaak__resultaat")
                    .values_list("zaak___expand__resultaat", flat=True)
                    .distinct()
                ),
                "archiefnominaties": list(
                    destruction_list.items.distinct(
                        "zaak__archiefnominatie"
                    ).values_list("zaak__archiefnominatie", flat=True)
                ),
                "comment": destruction_list.comment,
                "number_of_zaken": destruction_list.items.filter(
                    status=ListItemStatus.suggested
                ).count(),
            }

            items_max_min = destruction_list.items.aggregate(
                Min("zaak__archiefactiedatum"), Max("zaak__archiefactiedatum")
            )
            if archiefactiedatum_min := items_max_min.get(
                "zaak__archiefactiedatum__min"
            ):
                extra_data["min_archiefactiedatum"] = archiefactiedatum_min

            if archiefactiedatum_max := items_max_min.get(
                "zaak__archiefactiedatum__max"
            ):
                extra_data["max_archiefactiedatum"] = archiefactiedatum_max

            return EventDetails(
                event=event,
                instance=destruction_list,
                user=user,
                extra_data=extra_data,
            )

        case {
            "event": "destruction_list_review_response_processed" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            return EventDetails(
                event=event,
                instance=destruction_list,
                extra_data={
                    "number_of_zaken": destruction_list.items.filter(
                        status=ListItemStatus.suggested
                    ).count(),
                },
            )

        case {
            "event": "destruction_list_updated_assignees" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "user": str(username),
            "assignee": str(assignee),
            "comment": str(comment),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            user = User.objects.get(username=username)
            assignee = User.objects.get(username=assignee)

            return EventDetails(
                event=event,
                instance=destruction_list,
                user=user,
                extra_data={
                    "assignee": {
                        "pk": assignee.pk,
                        "email": assignee.email,
                        "username": assignee.username,
                    },
                    "comment": comment,
                },
            )
        case {
            "event": "destruction_list_co_reviewers_added" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "user": str(username),
            "comment": str(comment),
            "partial": bool(partial),
            "co_reviewers": co_reviewer_usernames,
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            user = User.objects.get(username=username)

            co_reviewers = User.objects.filter(
                username__in=co_reviewer_usernames
            ).order_by("username")
            return EventDetails(
                event=event,
                instance=destruction_list,
                user=user,
                extra_data={
                    "partial": partial,
                    "comment": comment,
                    "co_reviewers": [
                        co_reviewer.get_name_with_username()
                        for co_reviewer in co_reviewers
                    ],
                },
            )

        case {
            "event": "destruction_list_reviewed" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "user": str(username),
            "comment": str(comment),
            "approved": bool(approved),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            user = User.objects.get(username=username)
            return EventDetails(
                event=event,
                instance=destruction_list,
                user=user,
                extra_data={
                    "approved": approved,
                    "comment": comment,
                },
            )

        case {
            "event": "destruction_list_finalized" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "record_manager": str(username),
            "archivist": str(archivist),
            "comment": str(comment),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            record_manager = User.objects.get(username=username)
            archivist = User.objects.get(username=archivist)
            return EventDetails(
                event=event,
                instance=destruction_list,
                user=record_manager,
                extra_data={
                    "destruction_list_pk": destruction_list.pk,
                    "destruction_list_name": destruction_list.name,
                    "comment": comment,
                    "archivist": {
                        "pk": archivist.pk,
                        "email": archivist.email,
                        "username": archivist.username,
                    },
                },
            )

        case {
            "event": "destruction_list_aborted" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "user": str(username),
            "comment": str(comment),
            "abort_destruction": bool(abort_destruction),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            user = User.objects.get(username=username)
            return EventDetails(
                event=event,
                instance=destruction_list,
                user=user,
                extra_data={
                    "abort_destruction": abort_destruction,
                    "comment": comment,
                },
            )

        case {
            "event": "destruction_list_deletion_failed" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            return EventDetails(
                event=event,
                instance=destruction_list,
            )

        case {
            "event": "destruction_list_items_deleted" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
            "number_deleted_items": int(number_deleted_items),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)
            return EventDetails(
                event=event,
                instance=destruction_list,
                extra_data={
                    "number_deleted_items": number_deleted_items,
                    "number_of_zaken": destruction_list.items.filter(
                        status=ListItemStatus.suggested
                    ).count(),
                },
            )

        case {
            "event": "destruction_list_processing_status_updated" as event,
            "destruction_list_uuid": str(destruction_list_uuid),
        }:
            destruction_list = DestructionList.objects.get(uuid=destruction_list_uuid)

            return EventDetails(
                event=event,
                instance=destruction_list,
                extra_data={
                    "status": destruction_list.get_processing_status_display(),
                    "clarification": destruction_list.processing_status_clarification,
                },
            )

        case {
            "event": "destruction_list_item_processing_status_updated" as event,
            "destruction_list_item_pk": int(item_pk),
        }:
            destruction_list_item = DestructionListItem.objects.get(pk=item_pk)
            return EventDetails(
                event=event,
                instance=destruction_list_item.destruction_list,
                extra_data={
                    "status": destruction_list_item.get_processing_status_display(),
                    "clarification": destruction_list_item.processing_status_clarification,
                    "item_pk": destruction_list_item.pk,
                },
            )

        case {
            "event": "resync_started" | "resync_successful" | "resync_failed" as event
        }:
            return EventDetails(
                event=event,
                error=event_dict.get("exception", ""),
            )

        case _:  # pragma: no cover
            raise AssertionError(f"Unhandled event '{event_dict['event']}'!")

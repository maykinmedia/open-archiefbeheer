from typing import Protocol

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.emails.render_backend import get_sandboxed_backend

from .constants import InternalStatus
from .models import DestructionList, DestructionListAssignee


def notify(subject: str, body: str, context: dict, recipients: list[str]) -> None:
    if body == "" or subject == "" or len(recipients) == 0:
        return

    backend = get_sandboxed_backend()

    template = backend.from_string(body)
    formatted_body = template.render(context=context)

    send_mail(
        subject=subject,
        message=formatted_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipients,
        fail_silently=False,
    )


def notify_reviewer(
    user: User,
    destruction_list: DestructionList,
) -> None:
    config = EmailConfig.get_solo()

    notify(
        subject=config.subject_review_required,
        body=config.body_review_required,
        context={"user": user, "list": destruction_list},
        recipients=[user.email],
    )


def notify_author_positive_review(
    user: User,
    destruction_list: DestructionList,
) -> None:
    config = EmailConfig.get_solo()

    last_reviewer = destruction_list.reviews.all().order_by("created").last().author

    notify(
        subject=config.subject_positive_review,
        body=config.body_positive_review,
        context={
            "user": user,
            "list": destruction_list,
            "last_reviewer": last_reviewer,
            "current_reviewer": destruction_list.assignee,
        },
        recipients=[user.email],
    )


def notify_author_changes_requested(
    user: User,
    destruction_list: DestructionList,
) -> None:
    config = EmailConfig.get_solo()

    notify(
        subject=config.subject_changes_requested,
        body=config.body_changes_requested,
        context={"user": user, "list": destruction_list},
        recipients=[user.email],
    )


def notify_author_last_review(
    user: User,
    destruction_list: DestructionList,
) -> None:
    config = EmailConfig.get_solo()

    last_reviewer = destruction_list.reviews.order_by("created").last().author

    notify(
        subject=config.subject_last_review,
        body=config.body_last_review,
        context={
            "user": user,
            "list": destruction_list,
            "last_reviewer": last_reviewer,
        },
        recipients=[user.email],
    )


def notify_assignees_successful_deletion(destruction_list: DestructionList) -> None:
    config = EmailConfig.get_solo()
    recipients = destruction_list.assignees.all().values_list("user__email", flat=True)

    notify(
        subject=config.subject_successful_deletion,
        body=config.body_successful_deletion,
        context={
            "list": destruction_list,
        },
        recipients=list(recipients),
    )


class ObjectWithStatus(Protocol):
    def set_processing_status(self, status: InternalStatus) -> None: ...


def process_new_assignees(
    destruction_list: DestructionList,
    assignees: list[dict],
    role: str,
) -> list[DestructionListAssignee]:
    with transaction.atomic():
        destruction_list.assignees.filter(role=role).delete()
        new_assignees = destruction_list.bulk_create_assignees(
            assignees,
            role,
        )

    return new_assignees

from contextlib import contextmanager
from typing import Protocol

from django.conf import settings
from django.core.mail import send_mail

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.emails.render_backend import get_sandboxed_backend

from .constants import InternalStatus
from .models import DestructionList


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


class ObjectWithStatus(Protocol):
    def set_processing_status(self, status: InternalStatus) -> None: ...


@contextmanager
def mark_as_failed_on_error(object_with_status: ObjectWithStatus):
    try:
        yield
    except Exception as exc:
        object_with_status.set_processing_status(InternalStatus.failed)
        raise exc

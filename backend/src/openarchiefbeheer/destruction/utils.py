from contextlib import contextmanager
from typing import Protocol

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.emails.render_backend import get_sandboxed_backend

from .constants import InternalStatus, ListRole
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


@contextmanager
def mark_as_failed_on_error(object_with_status: ObjectWithStatus):
    try:
        yield
    except Exception as exc:
        object_with_status.set_processing_status(InternalStatus.failed)
        raise exc


def process_new_assignees(
    destruction_list: DestructionList,
    assignees: list[dict],
    role: str,
) -> list[DestructionListAssignee]:
    """
    Remove any assignees that are not present in the new assignees and create the new ones.

    Example:
    Before reassigning there are reviewerA, reviewerB and reviewerC.
    The record manager requests that the new reviewers are reviewerB and reviewerD.
    This function deletes reviewerA and reviewerC and creates reviewerD.
    """
    new_reviewers = []
    with transaction.atomic():
        current_assignees = destruction_list.assignees.all()
        current_users = [assignee["user"] for assignee in assignees]
        current_reviewers = current_assignees.filter(role=ListRole.reviewer)
        current_reviewers_list = list(
            current_reviewers.values_list("user__pk", flat=True)
        )

        for new_index, assignee in enumerate(assignees):
            """
            Iterate over every (new) `assignee` in `assignees` to create `new_reviewers`:

              - Check if the `assignee` is already in the `current_reviewers_list`

              - If `assignee` is in the `current_reviewers_list`:
                - Get the `current_index` of the `DestructionListAssignee` in  (filtered) `current_reviewers`
                - Use the index to get the `DestructionListAssignee`
                - Add the `DestructionListAssignee` to `new_reviewers`

              - If `assignee` is not the `current_reviewers_list`:
                - Create a new `DestructionListAssignee` based on `assignee`
                - Add the newly created `DestructionListAssignee` to new_reviewers
            """
            try:  # If `assignee` is in the `current_reviewers_list`
                # Get the `current_index` of the `DestructionListAssignee` in  (filtered) `current_reviewers`
                current_index = current_reviewers_list.index(assignee["user"].pk)

                # Use the index to get the `DestructionListAssignee`
                current_assignee = current_reviewers[current_index]

                # Add the `DestructionListAssignee` to `new_reviewers`
                new_reviewers.append(current_assignee)
            except ValueError:  # If `assignee` is not the `current_reviewers_list`
                # Create a new `DestructionListAssignee` based on `assignee`
                created_assignee = DestructionListAssignee.objects.create(
                    **assignee,
                    role=ListRole.reviewer,
                    destruction_list=destruction_list
                )
                # Add the newly created `DestructionListAssignee` to new_reviewers
                new_reviewers.append(created_assignee)

        # Destroy old `DestructionListAssignee` instances
        destruction_list.assignees.filter(
            ~Q(user__in=current_users), role=role
        ).delete()

        # Create new `DestructionListAssignee` instances
        destruction_list.assignees.set(new_reviewers)
    # FIXME: Order seems to be ok here, but incorrect in API response?
    return new_reviewers

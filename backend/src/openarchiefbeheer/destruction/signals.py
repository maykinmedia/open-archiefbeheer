import django.dispatch
from django.db.models.signals import post_save
from django.dispatch import receiver

from openarchiefbeheer.emails.models import EmailConfig

from .constants import ListRole, ReviewDecisionChoices
from .models import DestructionList, DestructionListAssignee, DestructionListReview
from .utils import (
    notify,
    notify_author_changes_requested,
    notify_author_positive_review,
    notify_reviewer,
)

user_assigned = django.dispatch.Signal()
deletion_failure = django.dispatch.Signal()


@receiver(post_save, sender=DestructionListReview)
def notify_author_after_review(sender, instance, created, **kwargs):
    review = instance
    if not created:
        return

    destruction_list = review.destruction_list

    if review.decision == ReviewDecisionChoices.rejected:
        notify_author_changes_requested(destruction_list.author, destruction_list)
        return

    notify_author_positive_review(destruction_list.author, destruction_list)


@receiver(user_assigned, sender=DestructionListAssignee)
def notify_reviewer_of_assignment(sender, assignee, **kwargs):
    if assignee.role != ListRole.main_reviewer:
        return

    notify_reviewer(assignee.user, assignee.destruction_list)


@receiver(deletion_failure)
def notify_author_of_failure(sender: DestructionList, **kwargs):
    config = EmailConfig.get_solo()

    notify(
        subject=config.subject_error_during_deletion,
        body=config.body_error_during_deletion,
        context={"list": sender},
        recipients=[sender.author.email],
    )

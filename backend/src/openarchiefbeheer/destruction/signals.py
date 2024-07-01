import django.dispatch
from django.db.models.signals import post_save
from django.dispatch import receiver

from .constants import ListRole, ReviewDecisionChoices
from .models import DestructionListAssignee, DestructionListReview
from .utils import (
    notify_author_changes_requested,
    notify_author_last_review,
    notify_author_positive_review,
    notify_reviewer,
)

user_assigned = django.dispatch.Signal()


@receiver(post_save, sender=DestructionListReview)
def notify_author_after_review(sender, instance, created, **kwargs):
    review = instance
    if not created:
        return

    destruction_list = review.destruction_list

    if review.decision == ReviewDecisionChoices.rejected:
        notify_author_changes_requested(destruction_list.author, destruction_list)
        return

    reviewers = destruction_list.assignees.filter(role=ListRole.reviewer).order_by(
        "order"
    )
    if not reviewers.exists():
        return

    is_last_review = review.author == reviewers.last().user
    if is_last_review:
        notify_author_last_review(destruction_list.author, destruction_list)
        return

    notify_author_positive_review(destruction_list.author, destruction_list)


@receiver(user_assigned, sender=DestructionListAssignee)
def notify_reviewer_of_assignment(sender, assignee, **kwargs):
    if assignee.role != ListRole.reviewer:
        return

    notify_reviewer(assignee.user, assignee.destruction_list)

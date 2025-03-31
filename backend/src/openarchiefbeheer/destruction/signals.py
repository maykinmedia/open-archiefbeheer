import django.dispatch
from django.core.cache import caches
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
co_reviewers_added = django.dispatch.Signal()


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


@receiver(post_save, sender=DestructionList)
def clear_cache_on_save(sender: DestructionList, **kwargs):
    cache = caches["choices_endpoints"]
    cache.clear()


@receiver(deletion_failure)
def notify_author_of_failure(sender: DestructionList, **kwargs):
    config = EmailConfig.get_solo()

    notify(
        subject=config.subject_error_during_deletion,
        body_html=config.body_error_during_deletion_html,
        body_text=config.body_error_during_deletion_text,
        context={"list_name": sender.name},
        recipients=[sender.author.email],
    )


@receiver(co_reviewers_added)
def notify_co_reviewers(sender: DestructionList, **kwargs):
    added_co_reviewers = kwargs.get("added_co_reviewers", [])
    if not added_co_reviewers:
        return

    config = EmailConfig.get_solo()
    notify(
        subject=config.subject_co_review_request,
        body_html=config.body_co_review_request_html,
        body_text=config.body_co_review_request_text,
        context={"list_name": sender.name},
        recipients=[co_reviewer["user"].email for co_reviewer in added_co_reviewers],
    )

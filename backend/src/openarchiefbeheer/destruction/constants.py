from django.db import models
from django.utils.translation import gettext_lazy as _


class ListStatus(models.TextChoices):
    new = "new", _("new")
    ready_to_review = "ready_to_review", _("ready to review")
    changes_requested = "changes_requested", _("changes requested")
    ready_to_delete = "ready_to_delete", _("ready to delete")
    deleted = "deleted", _("deleted")


class ListItemStatus(models.TextChoices):
    suggested = "suggested", _("suggested for destruction")
    removed = "removed", _("removed from the destruction list during review")


class ReviewDecisionChoices(models.TextChoices):
    accepted = "accepted", _("accepted")
    rejected = "rejected", _("rejected")


class ListRole(models.TextChoices):
    reviewer = "reviewer", _("Reviewer")
    author = "author", _("Author")


class DestructionListItemAction(models.TextChoices):
    keep = "keep", _("keep")
    remove = "remove", _("remove")


class InternalStatus(models.TextChoices):
    new = "new", _("new")
    queued = "queued", _("queued")
    processing = "processing", _("processing")
    failed = "failed", _("failed")
    succeeded = "succeeded", _("succeeded")

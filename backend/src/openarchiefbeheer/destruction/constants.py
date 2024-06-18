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
    processing = "processing", _("is currently being destroyed")
    destroyed = "destroyed", _("successfully destroyed")
    failed = "failed", _("destruction did not succeed")


class ReviewDecisionChoices(models.TextChoices):
    accepted = "accepted", _("accepted")
    rejected = "rejected", _("rejected")


class ListRole(models.TextChoices):
    reviewer = "reviewer", _("Reviewer")
    author = "author", _("Author")

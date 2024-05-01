from django.db import models
from django.utils.translation import gettext_lazy as _


class ListStatus(models.TextChoices):
    in_progress = "in_progress", _("in progress")
    processing = "processing", _("processing")
    completed = "completed", _("completed")


class ListItemStatus(models.TextChoices):
    suggested = "suggested", _("suggested for destruction")
    removed = "removed", _("removed from the destruction list during review")
    processing = "processing", _("is currently being destroyed")
    destroyed = "destroyed", _("successfully destroyed")
    failed = "failed", _("destruction did not succeed")

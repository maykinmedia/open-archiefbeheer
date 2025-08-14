from django.db import models
from django.utils.translation import gettext_lazy as _


class ListStatus(models.TextChoices):
    new = "new", _("new")
    ready_to_review = "ready_to_review", _("ready to review")
    changes_requested = "changes_requested", _("changes requested")
    internally_reviewed = "internally_reviewed", _("internally reviewed")
    ready_for_archivist = "ready_for_archivist", _("ready for archivist")
    ready_to_delete = "ready_to_delete", _("ready to delete")
    deleted = "deleted", _("deleted")


class ListItemStatus(models.TextChoices):
    suggested = "suggested", _("suggested for destruction")
    removed = "removed", _("removed from the destruction list during review")


class ReviewDecisionChoices(models.TextChoices):
    accepted = "accepted", _("accepted")
    rejected = "rejected", _("rejected")


class ListRole(models.TextChoices):
    main_reviewer = "main_reviewer", _("main reviewer")
    co_reviewer = "co_reviewer", _("co-reviewer")
    author = "author", _("author")
    archivist = "archivist", _("archivist")


class DestructionListItemAction(models.TextChoices):
    keep = "keep", _("keep")
    remove = "remove", _("remove")


class ZaakActionType(models.TextChoices):
    selectielijstklasse_and_bewaartermijn = "selectielijstklasse_and_bewaartermijn", _(
        "selectielijstklasse and bewaartermijn"
    )
    bewaartermijn = "bewaartermijn", _("bewaartermijn")


class InternalStatus(models.TextChoices):
    new = "new", _("new")
    queued = "queued", _("queued")
    processing = "processing", _("processing")
    failed = "failed", _("failed")
    succeeded = "succeeded", _("succeeded")


MAPPING_ROLE_PERMISSIONS = {
    ListRole.author: "accounts.can_start_destruction",
    ListRole.main_reviewer: "accounts.can_review_destruction",
    ListRole.co_reviewer: "accounts.can_co_review_destruction",
    ListRole.archivist: "accounts.can_review_final_list",
}

# Mapping to check if it is allowed to change an assignee
# based on the list status.
# Co-reviewers are not included because they have different logic (and their separate endpoint).
MAPPING_STATUS_ROLE_POSSIBLE_CHANGES = {
    ListStatus.new: [ListRole.main_reviewer, ListRole.author],
    ListStatus.ready_to_review: [ListRole.main_reviewer, ListRole.author],
    # Challenging: the changes could have been requested by a reviewr or an archivist.
    # We cannot decide based on the status alone.
    ListStatus.changes_requested: [
        ListRole.main_reviewer,
        ListRole.archivist,
        ListRole.author,
    ],
    # From internally_reviewed onward, we cannot change the reviewer (since they have nothing left to do)
    ListStatus.internally_reviewed: [ListRole.author],
    ListStatus.ready_for_archivist: [ListRole.archivist, ListRole.author],
    ListStatus.ready_to_delete: [ListRole.author],
}

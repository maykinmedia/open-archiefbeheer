from django.db import models
from django.utils.translation import gettext_lazy as _

from openarchiefbeheer.destruction.constants import ListItemStatus, ListStatus


class DestructionList(models.Model):
    name = models.CharField(_("name"), max_length=200, unique=True)
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="created_lists",
        verbose_name=_("author"),
        help_text=_("Creator of destruction list."),
    )
    created = models.DateTimeField(auto_now_add=True)
    end = models.DateTimeField(
        _("end"),
        blank=True,
        null=True,
        help_text=_(
            "The timestamp at which all the cases in the list have been deleted."
        ),
    )
    contains_sensitive_info = models.BooleanField(
        verbose_name=_("contains sensitive information"),
        help_text=_(
            "Specify whether this destruction list contains privacy sensitive data. "
            "If set to true, the report of destruction will NOT contain case "
            "descriptions or the remarks by the reviewers."
        ),
        default=True,
    )
    assignee = models.ForeignKey(
        "accounts.User",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="assigned_lists",
        verbose_name=_("assignee"),
        help_text=_("Currently assigned user."),
    )
    status = models.CharField(
        _("status"),
        default=ListStatus.in_progress,
        choices=ListStatus.choices,
        max_length=80,
    )
    zaak_destruction_report_url = models.URLField(
        _("zaak destruction report URL"),
        help_text=_(
            "The URL of the case containing the destruction report for this destruction list."
        ),
        blank=True,
    )

    class Meta:
        verbose_name = _("destruction list")
        verbose_name_plural = _("destruction lists")

    def __str__(self):
        return self.name


class DestructionListItem(models.Model):
    destruction_list = models.ForeignKey(
        DestructionList,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("destruction list"),
    )
    zaak = models.URLField(
        _("zaak"),
        db_index=True,
        help_text=_(
            "URL-reference to the ZAAK (in Zaken API), which is planned to be destroyed."
        ),
    )
    status = models.CharField(
        _("status"),
        default=ListItemStatus.suggested,
        choices=ListItemStatus.choices,
        max_length=80,
    )
    extra_zaak_data = models.JSONField(
        verbose_name=_("extra zaak data"),
        help_text=_("Additional information of the zaak"),
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("destruction list item")
        verbose_name_plural = _("destruction list items")
        unique_together = ("destruction_list", "zaak")

    def __str__(self):
        return f"{self.destruction_list}: {self.zaak}"

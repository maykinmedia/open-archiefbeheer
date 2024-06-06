import logging
import uuid as _uuid

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from ordered_model.models import OrderedModel

from openarchiefbeheer.destruction.constants import ListItemStatus, ListStatus
from openarchiefbeheer.emails.utils import send_review_request_email
from openarchiefbeheer.zaken.api.serializers import ZaakSerializer
from openarchiefbeheer.zaken.models import Zaak

logger = logging.getLogger(__name__)


class DestructionList(models.Model):
    name = models.CharField(_("name"), max_length=200, unique=True)
    uuid = models.UUIDField(_("uuid"), default=_uuid.uuid4, unique=True)
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
    status_changed = models.DateTimeField(
        _("status changed"),
        help_text=_("Tracks when the status was changed."),
        blank=True,
        null=True,
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

    @staticmethod
    def assign(assignee: "DestructionListAssignee") -> None:
        assignee.assign()

    def set_status(self, status: str) -> None:
        self.status = status
        self.status_changed = timezone.now()
        self.save()

    def bulk_create_assignees(
        self, assignees_data: dict
    ) -> list["DestructionListAssignee"]:
        return DestructionListAssignee.objects.bulk_create(
            [
                DestructionListAssignee(**{**assignee, "destruction_list": self})
                for assignee in assignees_data
            ]
        )

    def bulk_create_items(self, items_data: dict) -> list["DestructionListItem"]:
        return DestructionListItem.objects.bulk_create(
            [
                DestructionListItem(**{**item, "destruction_list": self})
                for item in items_data
            ]
        )


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

    def get_zaak_data(self) -> dict | None:
        if self.status == ListItemStatus.removed:
            # The case does not exist anymore. We cannot retrieve details.
            return None

        zaak = Zaak.objects.filter(url=self.zaak).first()
        if not zaak:
            logger.error(
                'Zaak with url %s and status "%s" could not be found in the cache.',
                self.zaak,
                self.status,
            )
            return None

        serializer = ZaakSerializer(instance=zaak)
        return serializer.data


class DestructionListAssignee(OrderedModel):
    destruction_list = models.ForeignKey(
        DestructionList,
        on_delete=models.CASCADE,
        related_name="assignees",
        verbose_name=_("destruction list"),
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        verbose_name=_("user"),
        help_text=_("The user assigned to the destruction list."),
    )
    assigned_on = models.DateTimeField(_("assigned on"), blank=True, null=True)

    class Meta(OrderedModel.Meta):
        verbose_name = _("destruction list assignee")
        verbose_name_plural = _("destruction list assignees")
        unique_together = ("destruction_list", "user")

    def __str__(self):
        return f"{self.user} ({self.destruction_list}, {self.order})"

    def assign(self) -> None:
        # TODO Log assignment
        self.destruction_list.assignee = self.user
        self.assigned_on = timezone.now()

        self.destruction_list.save()
        self.save()

        self.notify()

    def notify(self) -> None:
        if not self.user.email:
            return

        is_reviewer = self.user != self.destruction_list.author
        if is_reviewer:
            send_review_request_email(self.user, self.destruction_list)

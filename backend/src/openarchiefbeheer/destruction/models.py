import csv
import logging
import uuid as _uuid
from datetime import date
from tempfile import NamedTemporaryFile
from typing import TYPE_CHECKING, Iterable, Optional

from django.contrib.contenttypes.fields import GenericRelation
from django.core.files import File
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from privates.fields import PrivateMediaFileField
from slugify import slugify
from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.utils.results_store import ResultStore
from openarchiefbeheer.zaken.utils import (
    delete_zaak_and_related_objects,
    get_zaak_metadata,
)

from .assignment_logic import STATE_MANAGER
from .constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
    ZaakActionType,
)
from .exceptions import ZaakArchiefactiedatumInFuture, ZaakNotFound

if TYPE_CHECKING:
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
        default=ListStatus.new,
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
        max_length=1000,
    )
    processing_status = models.CharField(
        _("processing status"),
        choices=InternalStatus.choices,
        max_length=80,
        help_text=_(
            "Field used to track the status of the deletion of a destruction list."
        ),
        default=InternalStatus.new,
    )
    planned_destruction_date = models.DateField(
        _("planned destruction date"),
        help_text=_("Date from which this destruction list can be deleted."),
        blank=True,
        null=True,
    )
    destruction_report = PrivateMediaFileField(
        _("destruction report"),
        upload_to="destruction_reports/%Y/%m/%d/",
        blank=True,
        null=True,
    )
    internal_results = models.JSONField(
        verbose_name=_("internal result"),
        help_text=_(
            "After this list is processed, the URL of the resources created in Open Zaak "
            "to store the destruction report are stored here."
        ),
        default=dict,
    )

    logs = GenericRelation(TimelineLog, related_query_name="destruction_list")

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

    def add_items(
        self, zaken: Iterable["Zaak"], ignore_conflicts: bool = False
    ) -> list["DestructionListItem"]:
        return DestructionListItem.objects.bulk_create(
            [
                DestructionListItem(
                    destruction_list=self, zaak=zaak, _zaak_url=zaak.url
                )
                for zaak in zaken
            ],
            ignore_conflicts=ignore_conflicts,
        )

    def remove_items(self, zaken: Iterable["Zaak"]) -> tuple[int, dict[str, int]]:
        return self.items.filter(zaak__in=zaken).delete()

    def get_author(self) -> "DestructionListAssignee":
        return self.assignees.get(role=ListRole.author)

    def get_assignee(self, user: User) -> Optional["DestructionListAssignee"]:
        return self.assignees.filter(user=user).first()

    def get_current_assignee(self) -> Optional["DestructionListAssignee"]:
        return self.assignees.filter(user=self.assignee).first()

    def assign_next(self) -> None:
        STATE_MANAGER[self.status].assign_next(self)

    def reassign(self) -> None:
        STATE_MANAGER[self.status].reassign(self)

    def has_short_review_process(self) -> bool:
        zaaktypes_urls = (
            self.items.all()
            .select_related("zaak")
            .values_list("zaak__zaaktype", flat=True)
            .distinct()
        )

        config = ArchiveConfig.get_solo()

        return all(
            [zaaktype in config.zaaktypes_short_process for zaaktype in zaaktypes_urls]
        )

    def has_failures(self) -> bool:
        return any(
            [
                status == InternalStatus.failed
                for status in self.items.values_list("processing_status", flat=True)
            ]
        )

    def all_items_can_be_deleted_by_date(self, destruction_date: date) -> bool:
        return not self.items.filter(
            zaak__archiefactiedatum__gt=destruction_date,
            status=ListItemStatus.suggested,
        ).exists()

    def abort_destruction(self) -> None:
        self.set_status(ListStatus.new)
        self.planned_destruction_date = None
        self.processing_status = InternalStatus.new
        self.save()

    def generate_destruction_report(self) -> None:
        if not self.status == ListStatus.deleted:
            logger.warning("The destruction list has not been deleted yet.")
            return

        fieldnames = [
            "url",
            "einddatum",
            "resultaat",
            "startdatum",
            "omschrijving",
            "identificatie",
            "zaaktype url",
            "zaaktype omschrijving",
            "selectielijst procestype nummer",
        ]
        with NamedTemporaryFile(mode="w", newline="", delete_on_close=False) as f_tmp:
            writer = csv.DictWriter(f_tmp, fieldnames=fieldnames)
            writer.writeheader()
            for item in self.items.filter(
                processing_status=InternalStatus.succeeded
            ).iterator(chunk_size=1000):
                data = {
                    **item.extra_zaak_data,
                    **{
                        "zaaktype url": item.extra_zaak_data["zaaktype"]["url"],
                        "zaaktype omschrijving": item.extra_zaak_data["zaaktype"][
                            "omschrijving"
                        ],
                        "selectielijst procestype nummer": item.extra_zaak_data[
                            "zaaktype"
                        ]["selectielijst_procestype"]["nummer"],
                    },
                }
                del data["zaaktype"]

                writer.writerow(data)

            f_tmp.close()
            with open(f_tmp.name, mode="r") as f:
                django_file = File(f)
                self.destruction_report.save(
                    f"report_{slugify(self.name)}.csv", django_file
                )

        self.save()

    def create_report_zaak(self) -> None:
        from .utils import (
            attach_report_to_zaak,
            create_eio_destruction_report,
            create_zaak_for_report,
        )

        if self.processing_status == InternalStatus.succeeded:
            return

        destruction_list = self
        store = ResultStore(store=destruction_list)

        create_zaak_for_report(destruction_list, store)
        create_eio_destruction_report(destruction_list, store)

        attach_report_to_zaak(destruction_list, store)

    def clear_local_metadata(self) -> None:
        self.items.update(extra_zaak_data={})


class DestructionListItem(models.Model):
    destruction_list = models.ForeignKey(
        DestructionList,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("destruction list"),
    )
    zaak = models.ForeignKey(
        "zaken.Zaak",
        on_delete=models.SET_NULL,
        related_name="items",
        verbose_name=_("zaak"),
        blank=True,
        null=True,
    )
    _zaak_url = models.URLField(
        _("zaak url"),
        max_length=1000,
        help_text=_(
            "Keep a relation to the zaak for when the zaken cached are being re-synced."
        ),
        blank=True,
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
    processing_status = models.CharField(
        _("processing status"),
        choices=InternalStatus.choices,
        max_length=80,
        help_text=_(
            "Field used to track the status of the deletion of a destruction list item."
        ),
        default=InternalStatus.new,
    )
    internal_results = models.JSONField(
        verbose_name=_("internal result"),
        help_text=_(
            "When this item gets processed, "
            "the URL of the resources deleted from Open Zaak get stored here."
        ),
        default=dict,
    )

    class Meta:
        verbose_name = _("destruction list item")
        verbose_name_plural = _("destruction list items")
        unique_together = ("destruction_list", "zaak")

    def __str__(self):
        if self.zaak:
            return f"{self.destruction_list}: {self.zaak.identificatie}"
        return f"{self.destruction_list}: (deleted)"

    def save(self, *args, **kwargs):
        if self.zaak:
            self._zaak_url = self.zaak.url
        return super().save(*args, **kwargs)

    def set_processing_status(self, status: InternalStatus) -> None:
        self.processing_status = status
        self.save()

    def _delete_zaak(self):
        if not self.zaak:
            logger.error("Could not find the zaak. Aborting deletion.")
            raise ZaakNotFound()

        if self.zaak.archiefactiedatum > date.today():
            logger.error(
                "Trying to delete zaak with archiefactiedatum in the future. Aborting deletion."
            )
            raise ZaakArchiefactiedatumInFuture()

        store = ResultStore(store=self)
        store.clear_traceback()

        delete_zaak_and_related_objects(zaak=self.zaak, result_store=store)

        self.zaak.delete()

    def process_deletion(self) -> None:
        self.processing_status = InternalStatus.processing
        self.extra_zaak_data = get_zaak_metadata(self.zaak)
        self.save()

        try:
            self._delete_zaak()
        except Exception:
            self.set_processing_status(InternalStatus.failed)
            return

        self.zaak = None
        self.processing_status = InternalStatus.succeeded
        self._zaak_url = ""
        self.save()


class DestructionListAssignee(models.Model):
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
    role = models.CharField(
        _("role"),
        default=ListRole.main_reviewer,
        choices=ListRole.choices,
        max_length=80,
    )

    class Meta:
        verbose_name = _("destruction list assignee")
        verbose_name_plural = _("destruction list assignees")
        unique_together = ("destruction_list", "user")

    def __str__(self):
        return f"{self.user} ({self.destruction_list})"

    def assign(self) -> None:
        from .signals import user_assigned

        # TODO Log assignment
        self.destruction_list.assignee = self.user
        self.assigned_on = timezone.now()

        self.destruction_list.save()
        self.save()

        user_assigned.send(sender=self.__class__, assignee=self)


class DestructionListReview(models.Model):
    destruction_list = models.ForeignKey(
        DestructionList,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name=_("destruction list"),
    )
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="created_reviews",
        verbose_name=_("author"),
        help_text=_("User who created the review."),
    )
    decision = models.CharField(
        _("decision"),
        choices=ReviewDecisionChoices.choices,
        max_length=80,
    )
    created = models.DateTimeField(auto_now_add=True)
    list_feedback = models.TextField(
        _("list feedback"),
        max_length=2000,
        blank=True,
        help_text=_("Feedback about the destruction list as a whole."),
    )

    class Meta:
        verbose_name = _("destruction list review")
        verbose_name_plural = _("destruction list reviews")

    def __str__(self):
        return f"Review for {self.destruction_list} ({self.author})"


class DestructionListItemReview(models.Model):
    destruction_list = models.ForeignKey(
        DestructionList,
        on_delete=models.CASCADE,
        related_name="item_reviews",
        verbose_name=_("destruction list"),
    )
    destruction_list_item = models.ForeignKey(
        DestructionListItem,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name=_("destruction list item"),
    )
    review = models.ForeignKey(
        DestructionListReview,
        on_delete=models.CASCADE,
        related_name="item_reviews",
        verbose_name=_("review"),
    )
    feedback = models.TextField(
        _("feedback"),
        max_length=2000,
        blank=False,
        help_text=_("What needs to be changed about the case."),
    )

    class Meta:
        verbose_name = _("destruction list item review")
        verbose_name_plural = _("destruction list item reviews")

    def __str__(self):
        return f"Case review for {self.destruction_list} ({self.destruction_list_item})"


class ReviewResponse(models.Model):
    review = models.ForeignKey(
        DestructionListReview,
        on_delete=models.CASCADE,
        related_name="responses",
        verbose_name=_("review"),
    )
    comment = models.TextField(
        _("comment"),
        max_length=2000,
        blank=True,
        help_text=_("The response of the author of the destruction list to a review."),
    )
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("review response")
        verbose_name_plural = _("review responses")

    def __str__(self):
        return f"Response to {self.review}"

    @property
    def items_responses(self) -> QuerySet["ReviewItemResponse"]:
        return ReviewItemResponse.objects.filter(review_item__review=self.review)

    @staticmethod
    def _derive_status(items_statuses: list[str]) -> str:
        if all([item_status == InternalStatus.new for item_status in items_statuses]):
            return InternalStatus.new

        if all(
            [item_status == InternalStatus.succeeded for item_status in items_statuses]
        ):
            return InternalStatus.succeeded

        if any(
            [item_status == InternalStatus.failed for item_status in items_statuses]
        ):
            return InternalStatus.failed

        if any(
            [item_status == InternalStatus.processing for item_status in items_statuses]
        ):
            return InternalStatus.processing

        if any(
            [item_status == InternalStatus.queued for item_status in items_statuses]
        ):
            return InternalStatus.queued

        return InternalStatus.processing

    @property
    def processing_status(self) -> str:
        items_statuses = self.items_responses.values_list(
            "processing_status", flat=True
        )
        return self._derive_status(items_statuses)


class ReviewItemResponse(models.Model):
    review_item = models.ForeignKey(
        DestructionListItemReview,
        on_delete=models.CASCADE,
        related_name="item_responses",
        verbose_name=_("review item"),
    )
    action_item = models.CharField(
        _("action item"),
        choices=DestructionListItemAction.choices,
        max_length=80,
    )
    action_zaak_type = models.CharField(
        _("action zaak type"),
        choices=ZaakActionType.choices,
        max_length=80,
        help_text=_("What type of change to do on the case. "),
        blank=True,
    )
    action_zaak = models.JSONField(
        _("action case"),
        blank=True,
        help_text=_("Fields that should be changed on the case."),
        null=True,
    )
    created = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(
        _("comment"),
        max_length=2000,
        blank=True,
        help_text=_(
            "The response of the author of the destruction list to "
            "feedback of the reviewer on a specific case."
        ),
    )
    processing_status = models.CharField(
        _("processing status"),
        choices=InternalStatus.choices,
        max_length=80,
        help_text=_(
            "Field used to track the status of the changes that should be made to a destruction list item and the corresponding case."
        ),
        default=InternalStatus.new,
    )

    class Meta:
        verbose_name = _("review item response")
        verbose_name_plural = _("review item responses")

    def __str__(self):
        return f"Response to {self.review_item}"

    def process(self) -> None:
        if self.processing_status == InternalStatus.succeeded:
            return

        self.processing_status = InternalStatus.processing
        self.save()

        destruction_list_item = self.review_item.destruction_list_item

        if self.action_item == DestructionListItemAction.remove:
            destruction_list_item.status = ListItemStatus.removed
            destruction_list_item.save()

            destruction_list_item.zaak.update_data(self.action_zaak)

        self.processing_status = InternalStatus.succeeded
        self.save()

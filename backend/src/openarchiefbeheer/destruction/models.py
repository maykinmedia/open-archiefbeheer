import logging
import uuid as _uuid
from typing import Optional

from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.utils.results_store import ResultStore
from openarchiefbeheer.zaken.api.serializers import ZaakSerializer
from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.utils import delete_zaak_and_related_objects

from .assignment_logic import STATE_MANAGER
from .constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
)

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

    def bulk_create_assignees(
        self, assignees_data: dict, role: str
    ) -> list["DestructionListAssignee"]:
        return DestructionListAssignee.objects.bulk_create(
            [
                DestructionListAssignee(
                    **{**assignee, "role": role, "destruction_list": self}
                )
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

    def all_reviewers_approved(self) -> bool:
        number_of_reviewers = self.assignees.filter(role=ListRole.reviewer).count()
        latest_reviews = self.reviews.order_by("created")
        number_of_reviews = len(latest_reviews)

        if number_of_reviews < number_of_reviewers:
            return False

        if number_of_reviews >= number_of_reviewers:
            latest_reviews = latest_reviews[number_of_reviews - number_of_reviewers :]

        return all(
            [
                review.decision == ReviewDecisionChoices.accepted
                for review in latest_reviews
            ]
        )

    def has_short_review_process(self) -> bool:
        zaken_urls = self.items.all().values_list("zaak", flat=True)

        zaken = Zaak.objects.filter(url__in=zaken_urls)
        zaaktypes_urls = set(zaken.values_list("zaaktype", flat=True))

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

    def set_processing_status(self, status: InternalStatus) -> None:
        self.processing_status = status
        self.save()

    def _delete_zaak(self):
        try:
            zaak = Zaak.objects.get(url=self.zaak)
        except ObjectDoesNotExist as exc:
            logger.error(
                "Could not find zaak with URL %s. Aborting deletion.", self.zaak
            )
            raise exc

        store = ResultStore(store=self)
        store.clear_traceback()

        delete_zaak_and_related_objects(zaak=zaak, result_store=store)

        zaak.delete()

    def process_deletion(self) -> None:
        self.processing_status = InternalStatus.processing
        self.save()

        try:
            self._delete_zaak()
        except Exception:
            self.set_processing_status(InternalStatus.failed)
            return

        self.processing_status = InternalStatus.succeeded
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
        default=ListRole.reviewer,
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

    def process(self):
        if self.processing_status == InternalStatus.succeeded:
            return

        self.processing_status = InternalStatus.processing
        self.save()

        destruction_list_item = self.review_item.destruction_list_item

        if self.action_item == DestructionListItemAction.remove:
            destruction_list_item.status = ListItemStatus.removed
            destruction_list_item.save()

        if self.action_zaak:
            zaak = Zaak.objects.get(url=destruction_list_item.zaak)
            zaak.update_data(self.action_zaak)

        self.processing_status = InternalStatus.succeeded
        self.save()

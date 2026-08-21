from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from privates.admin import PrivateMediaMixin

from .models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListCoReview,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
    ReviewItemResponse,
    ReviewResponse,
)


class DestructionListItemInline(admin.TabularInline):
    model = DestructionListItem
    fk_name = "destruction_list"
    readonly_fields = (
        "id_with_link",
        "zaak",
        "processing_status",
        "processing_status_clarification",
    )
    fields = (
        "id_with_link",
        "zaak",
        "processing_status",
        "processing_status_clarification",
    )
    extra = 0
    can_delete = False
    show_change_link = True
    template = "destruction/tabular.html"

    def has_add_permission(self, request, obj):
        return False

    def has_change_permission(self, request, obj):
        return False

    @admin.display(description=_("Identifier"))
    def id_with_link(self, obj: DestructionListItem):
        url = reverse("admin:destruction_destructionlistitem_change", args=(obj.id,))
        return format_html("<a href={}>{}</a>", url, str(obj))


@admin.register(DestructionList)
class DestructionListAdmin(PrivateMediaMixin, admin.ModelAdmin):
    list_display = ("name", "status", "processing_status", "created", "end")
    list_filter = ("status", "processing_status", "assignee")
    search_fields = ("name",)
    readonly_fields = ("uuid", "created", "processing_status_clarification")
    fields = (
        "name",
        "uuid",
        "comment",
        "contains_sensitive_info",
        "created",
        "end",
        "planned_destruction_date",
        "assignee",
        "status",
        "status_changed",
        "processing_status",
        "processing_status_clarification",
    )
    exclude = ["destruction_report"]
    inlines = (DestructionListItemInline,)


@admin.register(DestructionListItem)
class DestructionListItemAdmin(admin.ModelAdmin):
    list_display = (
        "item",
        "status",
        "processing_status",
    )
    list_filter = ("status", "processing_status")
    readonly_fields = ("processing_status_clarification", "_zaak_url")
    fields = (
        "destruction_list",
        "zaak",
        "_zaak_url",
        "status",
        "processing_status",
        "processing_status_clarification",
        "excluded_relations",
    )
    search_fields = ("destruction_list__name",)
    raw_id_fields = ("destruction_list", "zaak")

    def item(self, obj):
        return f"Item {obj.pk}"


@admin.register(DestructionListAssignee)
class DestructionListAssigneeAdmin(admin.ModelAdmin):
    list_display = ("user", "destruction_list", "assigned_on")
    search_fields = ("user__username",)
    raw_id_fields = ("destruction_list",)


class DestructionListItemReviewInline(admin.TabularInline):
    model = DestructionListItemReview
    fields = ("destruction_list_item", "feedback")

    def has_add_permission(self, request, obj):
        return False

    def has_change_permission(self, request, obj):
        return False


@admin.register(DestructionListReview)
class DestructionListReviewAdmin(admin.ModelAdmin):
    list_display = ("author", "destruction_list", "decision")
    search_fields = ("author__username", "destruction_list__name")
    raw_id_fields = ("destruction_list",)
    inlines = (DestructionListItemReviewInline,)


@admin.register(DestructionListCoReview)
class DestructionListCoReviewAdmin(admin.ModelAdmin):
    list_display = ("author", "destruction_list")
    search_fields = ("author__username", "destruction_list__name")
    raw_id_fields = ("destruction_list",)


@admin.register(DestructionListItemReview)
class DestructionListItemReviewAdmin(admin.ModelAdmin):
    list_display = ("destruction_list", "destruction_list_item")
    search_fields = ("destruction_list__name", "destruction_list_item__zaak")
    raw_id_fields = ("destruction_list", "review", "destruction_list_item")


@admin.register(ReviewResponse)
class ReviewResponseAdmin(admin.ModelAdmin):
    list_display = ("review",)
    search_fields = (
        "review__author__username",
        "review__destruction_list__name",
        "review__destruction_list__author__username",
    )


@admin.register(ReviewItemResponse)
class ReviewItemResponse(admin.ModelAdmin):
    list_display = ("review_item", "action_item")
    search_fields = (
        "review_item__destruction_list_item__zaak",
        "review_item__review__author__username",
        "review_item__destruction_list__author__username",
        "review_item__destruction_list__name",
    )

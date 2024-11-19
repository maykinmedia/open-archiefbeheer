from django.contrib import admin

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


@admin.register(DestructionList)
class DestructionListAdmin(PrivateMediaMixin, admin.ModelAdmin):
    list_display = ("name", "status", "created", "end")
    list_filter = ("status", "assignee")
    search_fields = ("name",)
    readonly_fields = ("uuid",)


@admin.register(DestructionListItem)
class DestructionListItemAdmin(admin.ModelAdmin):
    list_display = (
        "item",
        "status",
        "processing_status",
    )
    list_filter = ("status", "processing_status")
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

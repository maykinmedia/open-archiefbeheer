from django.contrib import admin

from .models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListItem,
    DestructionListItemReview,
    DestructionListReview,
)


@admin.register(DestructionList)
class DestructionListAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "created", "end")
    list_filter = ("status", "assignee")
    search_fields = ("name",)
    readonly_fields = ("uuid",)


@admin.register(DestructionListItem)
class DestructionListItemAdmin(admin.ModelAdmin):
    list_display = (
        "zaak",
        "status",
    )
    list_filter = ("status",)
    search_fields = ("zaak",)
    raw_id_fields = ("destruction_list",)


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


@admin.register(DestructionListItemReview)
class DestructionListItemReviewAdmin(admin.ModelAdmin):
    list_display = ("destruction_list", "destruction_list_item")
    search_fields = ("destruction_list__name", "destruction_list_item__zaak")
    raw_id_fields = ("destruction_list", "review", "destruction_list_item")

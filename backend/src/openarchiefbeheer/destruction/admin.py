from django.contrib import admin

from .models import DestructionList, DestructionListAssignee, DestructionListItem


@admin.register(DestructionList)
class DestructionListAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "end")
    list_filter = ("status", "assignee")
    search_fields = ("name",)


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

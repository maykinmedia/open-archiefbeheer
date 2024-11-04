from django.contrib import admin

from .models import SelectionItem


@admin.register(SelectionItem)
class SelectionItemAdmin(admin.ModelAdmin):
    list_display = (
        "key",
        "zaak_url",
        "selection_data",
    )
    list_filter = ("key",)
    search_fields = ("zaak_url", "key")

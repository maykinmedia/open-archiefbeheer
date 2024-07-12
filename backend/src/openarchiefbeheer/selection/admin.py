from django.contrib import admin

from openarchiefbeheer.selection.models import ZaakSelection, ZaakSelectionItem


@admin.register(ZaakSelection)
class ZaakSelectionAdmin(admin.ModelAdmin):
    list_display = ("slug",)


@admin.register(ZaakSelectionItem)
class ZaakSelectionItemAdmin(admin.ModelAdmin):
    list_display = ("zaak_selection",)

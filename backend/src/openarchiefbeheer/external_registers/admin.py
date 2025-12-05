from django.contrib import admin
from django.http import HttpRequest

from .models import ExternalRegisterConfig


@admin.register(ExternalRegisterConfig)
class ExternalRegisterConfigAdmin(admin.ModelAdmin):
    list_display = (
        "identifier",
        "enabled",
    )
    search_fields = ("identifier",)
    readonly_fields = ("identifier",)

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_delete_permission(
        self, request: HttpRequest, obj: ExternalRegisterConfig | None = None
    ) -> bool:
        return False

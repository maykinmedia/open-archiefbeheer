from typing import NoReturn

from django import forms
from django.contrib import admin
from django.db.models import Q
from django.http import HttpRequest
from django.utils.translation import gettext as _

from zgw_consumers.models import Service

from .models import ExternalRegisterConfig


class ExternalRegisterConfigAdminForm(forms.ModelForm):
    class Meta:
        fields = ("identifier", "enabled", "services")

    def clean(self) -> dict[str, list[Service] | bool | str] | NoReturn:
        cleaned_data = super().clean()

        if updated_services := cleaned_data.get("services", []):
            service_pks = [service.pk for service in updated_services]
            qs = ExternalRegisterConfig.objects.filter(services__id__in=service_pks)
            if self.instance:
                qs = qs.filter(~Q(pk=self.instance.pk))
            if qs.count() > 0:
                # TODO: Improve so that it says which service and which plugin.
                raise forms.ValidationError(
                    _(
                        "One or more of the selected services are already used by another plugin"
                    ),
                    code="invalid",
                )

        return cleaned_data


@admin.register(ExternalRegisterConfig)
class ExternalRegisterConfigAdmin(admin.ModelAdmin):
    list_display = (
        "identifier",
        "enabled",
    )
    search_fields = ("identifier",)
    readonly_fields = ("identifier",)
    form = ExternalRegisterConfigAdminForm

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_delete_permission(
        self, request: HttpRequest, obj: ExternalRegisterConfig | None = None
    ) -> bool:
        return False

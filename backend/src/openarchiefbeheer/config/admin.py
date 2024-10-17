from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from solo.admin import SingletonModelAdmin

from .models import APIConfig, ArchiveConfig


@admin.register(ArchiveConfig)
class ArchiveConfigAdmin(SingletonModelAdmin):
    fieldsets = [
        (
            _("Short procedure"),
            {
                "fields": ["zaaktypes_short_process"],
            },
        ),
        (
            _("Zaak report destruction settings"),
            {
                "fields": [
                    "bronorganisatie",
                    "zaaktype",
                    "statustype",
                    "resultaattype",
                    "informatieobjecttype",
                    "selectielijstklasse",
                ],
            },
        ),
    ]


@admin.register(APIConfig)
class APIConfigAdmin(SingletonModelAdmin):
    pass

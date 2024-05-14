from django.contrib import admin

from .models import Zaak


@admin.register(Zaak)
class ZaakAdmin(admin.ModelAdmin):
    pass

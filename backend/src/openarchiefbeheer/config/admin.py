from django.contrib import admin

from solo.admin import SingletonModelAdmin

from .models import APIConfig, ArchiveConfig


@admin.register(ArchiveConfig)
class ArchiveConfigAdmin(SingletonModelAdmin):
    pass


@admin.register(APIConfig)
class APIConfigAdmin(SingletonModelAdmin):
    pass

from django.contrib import admin

from solo.admin import SingletonModelAdmin

from .models import ArchiveConfig


@admin.register(ArchiveConfig)
class ArchiveConfigAdmin(SingletonModelAdmin):
    pass

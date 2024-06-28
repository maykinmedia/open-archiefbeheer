from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from solo.admin import SingletonModelAdmin

from .models import EmailConfig


@admin.register(EmailConfig)
class EmailConfigAdmin(SingletonModelAdmin):
    fieldsets = [
        (
            _("Template review request"),
            {
                "fields": ["subject_review_required", "body_review_required"],
            },
        ),
        (
            _("Template review reminder"),
            {
                "fields": ["subject_review_reminder", "body_review_reminder"],
            },
        ),
        (
            _("Template changes requested"),
            {
                "fields": ["subject_changes_requested", "body_changes_requested"],
            },
        ),
        (
            _("Templates positive review"),
            {
                "fields": [
                    "subject_positive_review",
                    "body_positive_review",
                    "subject_last_review",
                    "body_last_review",
                ]
            },
        ),
    ]

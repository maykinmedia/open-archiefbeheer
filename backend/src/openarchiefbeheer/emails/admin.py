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
                "fields": [
                    "subject_review_required",
                    "body_review_required_html",
                    "body_review_required_text",
                    "subject_co_review_request",
                    "body_co_review_request_html",
                    "body_co_review_request_text",
                ],
            },
        ),
        (
            _("Template review reminder"),
            {
                "fields": [
                    "subject_review_reminder",
                    "body_review_reminder_html",
                    "body_review_reminder_text",
                ],
            },
        ),
        (
            _("Template changes requested"),
            {
                "fields": [
                    "subject_changes_requested",
                    "body_changes_requested_html",
                    "body_changes_requested_text",
                ],
            },
        ),
        (
            _("Templates positive review"),
            {
                "fields": [
                    "subject_positive_review",
                    "body_positive_review_html",
                    "body_positive_review_text",
                ]
            },
        ),
        (
            _("Templates error during deletion"),
            {
                "fields": [
                    "subject_error_during_deletion",
                    "body_error_during_deletion_html",
                    "body_error_during_deletion_text",
                ]
            },
        ),
        (
            _("Templates successful deletion"),
            {
                "fields": [
                    "subject_successful_deletion",
                    "body_successful_deletion_html",
                    "body_successful_deletion_text",
                ]
            },
        ),
    ]

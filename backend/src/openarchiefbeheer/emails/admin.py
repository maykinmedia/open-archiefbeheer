from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.template import TemplateSyntaxError
from django.utils.translation import gettext_lazy as _

from solo.admin import SingletonModelAdmin

from .models import EmailConfig
from .render_backend import get_sandboxed_backend


class EmailConfigForm(forms.ModelForm):
    TEMPLATE_FIELDS_TO_VALIDATE = [
        "body_review_required_html",
        "body_review_required_text",
        "body_co_review_request_html",
        "body_co_review_request_text",
        "body_review_reminder_html",
        "body_review_reminder_text",
        "body_changes_requested_html",
        "body_changes_requested_text",
        "body_positive_review_html",
        "body_positive_review_text",
        "body_error_during_deletion_html",
        "body_error_during_deletion_text",
        "body_successful_deletion_html",
        "body_successful_deletion_text",
    ]

    class Meta:
        model = EmailConfig
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        assert cleaned_data is not None

        backend = get_sandboxed_backend()
        errors = {}
        for field in self.TEMPLATE_FIELDS_TO_VALIDATE:
            try:
                backend.from_string(cleaned_data[field])
            except TemplateSyntaxError as e:  # noqa: PERF203
                errors[field] = _("Error in template: {e}").format(e=e)

        if errors:
            raise ValidationError(errors, code="invalid-template")

        return cleaned_data


@admin.register(EmailConfig)
class EmailConfigAdmin(SingletonModelAdmin):
    form = EmailConfigForm
    fieldsets = [
        (
            _("General"),
            {"fields": ["enable_email_notifications"]},
        ),
        (
            _("Template review request"),
            {
                "fields": [
                    "subject_review_required",
                    "body_review_required_html",
                    "body_review_required_text",
                ],
            },
        ),
        (
            _("Template co-review request"),
            {
                "fields": [
                    "subject_co_review_request",
                    "body_co_review_request_html",
                    "body_co_review_request_text",
                ]
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

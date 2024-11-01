from django.db import models
from django.utils.translation import gettext_lazy as _

from solo.models import SingletonModel


class EmailConfig(SingletonModel):
    subject_review_required = models.CharField(
        max_length=250,
        verbose_name=_("subject review required"),
        help_text=_(
            "Subject of the email that will be sent to a reviewer "
            "when there is a destruction list ready to be reviewed."
        ),
    )
    body_review_required = models.TextField(
        verbose_name=_("body review required"),
        help_text=_(
            "Body of the email that will be sent to a reviewer "
            "when there is a destruction list ready to be reviewed."
        ),
    )
    subject_review_reminder = models.CharField(
        max_length=250,
        verbose_name=_("subject review reminder"),
        help_text=_(
            "Subject of the email that will be sent to a reviewer "
            "after a configured period of time if they still haven't reviewed a destruction list."
        ),
    )
    body_review_reminder = models.TextField(
        verbose_name=_("body review reminder"),
        help_text=_(
            "Body of the email that will be sent to a reviewer "
            "after a configured period of time if they still haven't reviewed a destruction list."
        ),
    )
    subject_changes_requested = models.CharField(
        max_length=250,
        verbose_name=_("subject changes requested"),
        help_text=_(
            "Subject of the email that will be sent to the record manager "
            "when a reviewer has requested changes to a destruction list."
        ),
    )
    body_changes_requested = models.TextField(
        verbose_name=_("body changes requested"),
        help_text=_(
            "Body of the email that will be sent to the record manager "
            "when a reviewer has requested changes to a destruction list."
        ),
    )
    subject_positive_review = models.CharField(
        max_length=250,
        verbose_name=_("subject positive review"),
        help_text=_(
            "Subject of the email that will be sent to the record manager "
            "when a reviewer has approved a destruction list."
        ),
        blank=True,
    )
    body_positive_review = models.TextField(
        verbose_name=_("body positive review"),
        help_text=_(
            "Body of the email that will be sent to the record manager "
            "when a reviewer has approved a destruction list."
        ),
        blank=True,
    )
    subject_co_review_request = models.CharField(
        max_length=250,
        verbose_name=_("subject co-review request"),
        help_text=_(
            "Subject of the email that will be sent to the co-reviewer(s) "
            "when the main reviewer assigns them."
        ),
        blank=True,
    )
    body_co_review_request = models.TextField(
        verbose_name=_("body co-review request"),
        help_text=_(
            "Body of the email that will be sent to the co-reviewer(s) "
            "when the main reviewer assigns them."
        ),
        blank=True,
    )
    subject_error_during_deletion = models.CharField(
        max_length=250,
        verbose_name=_("subject error during deletion"),
        help_text=_(
            "Subject of the email that will be sent to the record manager "
            "when an error happened during deletion."
        ),
        blank=True,
    )
    body_error_during_deletion = models.TextField(
        verbose_name=_("body error during deletion"),
        help_text=_(
            "Body of the email that will be sent to the record manager "
            "when an error happened during deletion."
        ),
        blank=True,
    )
    subject_successful_deletion = models.CharField(
        max_length=250,
        verbose_name=_("subject successful deletion"),
        help_text=_(
            "Subject of the email that will be sent to all the assignees "
            "when a list is successfully deleted."
        ),
        blank=True,
    )
    body_successful_deletion = models.TextField(
        verbose_name=_("body successful deletion"),
        help_text=_(
            "Body of the email that will be sent to all the assignees "
            "when a list is successfully deleted."
        ),
        blank=True,
    )

    class Meta:
        verbose_name = _("email configuration")
        verbose_name_plural = _("email configurations")

    def __str__(self):
        return "Email configuration"

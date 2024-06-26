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
    subject_last_review = models.CharField(
        max_length=250,
        verbose_name=_("subject last review"),
        help_text=_(
            "Subject of the email that will be sent to the record manager "
            "when the last reviewer has approved a destruction list."
        ),
        blank=True,
    )
    body_last_review = models.TextField(
        verbose_name=_("body last review"),
        help_text=_(
            "Body of the email that will be sent to the record manager "
            "when the last reviewer has approved a destruction list."
        ),
        blank=True,
    )

    class Meta:
        verbose_name = _("email configuration")
        verbose_name_plural = _("email configurations")

    def __str__(self):
        return "Email configuration"

from django.db import models
from django.utils.translation import gettext_lazy as _

from solo.models import SingletonModel


class EmailConfig(SingletonModel):
    enable_email_notifications = models.BooleanField(
        verbose_name=_("enable e-mail notifications"),
        help_text=_("Whether to enable e-mail notifications."),
        default=True,
    )
    subject_review_required = models.CharField(
        max_length=250,
        verbose_name=_("subject review required"),
        help_text=_(
            "Subject of the email that will be sent to a reviewer "
            "when there is a destruction list ready to be reviewed."
        ),
        blank=True,
        default="Uw beoordeling van een vernietigingslijst wordt gevraagd",
    )
    body_review_required_html = models.TextField(
        verbose_name=_("html body review required"),
        help_text=_(
            "HTML body of the email that will be sent to a reviewer "
            "when there is a destruction list ready to be reviewed."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }},\r\n\r\nUw beoordeling van een vernietigingslijst wordt gevraagd. "
            "U kunt <a href=\"{% destruction_list_link list_name 'review' %}\">hier</a> de lijst bekijken "
            "om te controleren of de zaken op de lijst daadwerkelijk vernietigd kunnen worden."
        ),
    )
    body_review_required_text = models.TextField(
        verbose_name=_("text body review required"),
        help_text=_(
            "Plain text body of the email that will be sent to a reviewer "
            "when there is a destruction list ready to be reviewed."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }},\r\n\r\nUw beoordeling van een vernietigingslijst wordt gevraagd. "
            "U kunt hier {% destruction_list_link list_name 'review' %} de lijst bekijken om te controleren "
            "of de zaken op de lijst daadwerkelijk vernietigd kunnen worden."
        ),
    )
    subject_review_reminder = models.CharField(
        max_length=250,
        verbose_name=_("subject review reminder"),
        help_text=_(
            "Subject of the email that will be sent to a reviewer "
            "after a configured period of time if they still haven't reviewed a destruction list."
        ),
        blank=True,
        default="Uw beoordeling van een vernietigingslijst wordt gevraagd (herinnering)",
    )
    body_review_reminder_html = models.TextField(
        verbose_name=_("html body review reminder"),
        help_text=_(
            "HTML body of the email that will be sent to a reviewer "
            "after a configured period of time if they still haven't reviewed a destruction list."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }}, \r\n\r\nU heeft kortgeleden een notificatie ontvangen over de "
            "Vernietigingslijst die wacht op uw goedkeuring. \r\n\r\nWij zien dat u nog niet geregeerd "
            "heeft, wilt u zo spoedig mogelijk op de Vernietigingslijst reageren."
        ),
    )
    body_review_reminder_text = models.TextField(
        verbose_name=_("text body review reminder"),
        help_text=_(
            "Plain text body of the email that will be sent to a reviewer "
            "after a configured period of time if they still haven't reviewed a destruction list."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }}, \r\n\r\nU heeft kortgeleden een notificatie ontvangen over de "
            "Vernietigingslijst die wacht op uw goedkeuring. \r\n\r\nWij zien dat u nog niet geregeerd "
            "heeft, wilt u zo spoedig mogelijk op de Vernietigingslijst reageren."
        ),
    )
    subject_changes_requested = models.CharField(
        max_length=250,
        verbose_name=_("subject changes requested"),
        help_text=_(
            "Subject of the email that will be sent to the record manager "
            "when a reviewer has requested changes to a destruction list."
        ),
        blank=True,
        default="Voorstel voor wijziging van uw vernietigingslijst",
    )
    body_changes_requested_html = models.TextField(
        verbose_name=_("html body changes requested"),
        help_text=_(
            "HTML body of the email that will be sent to the record manager "
            "when a reviewer has requested changes to a destruction list."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }},\r\n\r\nEr is een voorstel tot aanpassing van uw "
            "vernietigingslijst {{ list_name }}. U kunt de lijst en de voorgestelde wijziging "
            "<a href=\"{% destruction_list_link list_name 'process-review' %}\">hier</a> "
            "bekijken en af te handelen."
        ),
    )
    body_changes_requested_text = models.TextField(
        verbose_name=_("text body changes requested"),
        help_text=_(
            "Plain text body of the email that will be sent to the record manager "
            "when a reviewer has requested changes to a destruction list."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }},\r\n\r\nEr is een voorstel tot aanpassing van uw "
            "vernietigingslijst {{ list_name }}. U kunt de lijst en de voorgestelde wijziging "
            "hier {% destruction_list_link list_name 'process-review' %} bekijken en af te handelen."
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
        default="Goedkeuring vernietigingslijst",
    )
    body_positive_review_html = models.TextField(
        verbose_name=_("html body positive review"),
        help_text=_(
            "HTML body of the email that will be sent to the record manager "
            "when a reviewer has approved a destruction list."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }}, \r\n\r\nReviewer {{ reviewer }} heeft de Vernietigingslijst "
            "{{ list_name }} goedgekeurd. De lijst wacht nu op uw actie. U kunt "
            "<a href=\"{% destruction_list_link list_name 'edit' %}\">hier</a> de lijst bekijken."
        ),
    )
    body_positive_review_text = models.TextField(
        verbose_name=_("text body positive review"),
        help_text=_(
            "Plain text body of the email that will be sent to the record manager "
            "when a reviewer has approved a destruction list."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }}, \r\n\r\nReviewer {{ reviewer }} heeft de Vernietigingslijst "
            "{{ list_name }} goedgekeurd. De lijst wacht nu op uw actie. U kunt hier "
            "{% destruction_list_link list_name 'edit' %} de lijst bekijken."
        ),
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
    body_co_review_request_html = models.TextField(
        verbose_name=_("HTML body co-review request"),
        help_text=_(
            "HTML body of the email that will be sent to the co-reviewer(s) "
            "when the main reviewer assigns them."
        ),
        blank=True,
    )
    body_co_review_request_text = models.TextField(
        verbose_name=_("text body co-review request"),
        help_text=_(
            "Plain text body of the email that will be sent to the co-reviewer(s) "
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
        default="Fout tijdens vernietiging",
    )
    body_error_during_deletion_html = models.TextField(
        verbose_name=_("HTML body error during deletion"),
        help_text=_(
            "HTML body of the email that will be sent to the record manager "
            "when an error happened during deletion."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }},\r\n\r\nEr is een fout opgetreden tijdens het vernietigen "
            "van vernietigingslijst {{ list_name }}. Probeer het opnieuw of neem contact op "
            "met de IT afdeling."
        ),
    )
    body_error_during_deletion_text = models.TextField(
        verbose_name=_("text body error during deletion"),
        help_text=_(
            "Plain text body of the email that will be sent to the record manager "
            "when an error happened during deletion."
        ),
        blank=True,
        default=(
            "Beste {{ user_name }},\r\n\r\nEr is een fout opgetreden tijdens het vernietigen "
            "van vernietigingslijst {{ list_name }}. Probeer het opnieuw of neem contact op "
            "met de IT afdeling."
        ),
    )
    subject_successful_deletion = models.CharField(
        max_length=250,
        verbose_name=_("subject successful deletion"),
        help_text=_(
            "Subject of the email that will be sent to all the assignees "
            "when a list is successfully deleted."
        ),
        blank=True,
        default="Lijst succesvol verwerkt",
    )
    body_successful_deletion_html = models.TextField(
        verbose_name=_("HTML body successful deletion"),
        help_text=_(
            "HTML body of the email that will be sent to all the assignees "
            "when a list is successfully deleted."
        ),
        blank=True,
        default=(
            "Beste,\r\n\r\nLijst {{ list_name }} is succesvol verwerkt. "
            "Alle zaken en gerelateerde objecten zijn vernietigd."
        ),
    )
    body_successful_deletion_text = models.TextField(
        verbose_name=_("text body successful deletion"),
        help_text=_(
            "Text body of the email that will be sent to all the assignees "
            "when a list is successfully deleted."
        ),
        blank=True,
        default=(
            "Beste,\r\n\r\nLijst {{ list_name }} is succesvol verwerkt. "
            "Alle zaken en gerelateerde objecten zijn vernietigd."
        ),
    )

    class Meta:
        verbose_name = _("email configuration")
        verbose_name_plural = _("email configurations")

    def __str__(self):
        return "Email configuration"

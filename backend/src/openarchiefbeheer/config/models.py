from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _

from solo.models import SingletonModel


class ArchiveConfig(SingletonModel):
    zaaktypes_short_process = ArrayField(
        models.URLField(max_length=1000),
        verbose_name=_("zaaktypes short process"),
        help_text=_(
            "If a destruction list only contains cases with types present in this field, "
            "this list will have a shortened review process. This means that no archivist will "
            "have to approve this list before it is deleted."
        ),
        default=list,
        blank=True,
    )

    bronorganisatie = models.CharField(
        "bronorganisatie",
        max_length=9,
        blank=True,
        help_text=_("Source organisation RSIN"),
    )
    zaaktype = models.URLField(
        "zaaktype",
        blank=True,
        max_length=1000,
        help_text=_(
            "The case type URL to use when creating the case for the destruction list deletion."
        ),
    )
    statustype = models.URLField(
        "statustype",
        blank=True,
        max_length=1000,
        help_text=_(
            "The status type URL to use when creating the case for the destruction list deletion."
        ),
    )
    resultaattype = models.URLField(
        "resultaattype",
        blank=True,
        max_length=1000,
        help_text=_(
            "The result type URL to use when creating the case for the destruction list deletion."
        ),
    )
    informatieobjecttype = models.URLField(
        "informatieobjecttype",
        blank=True,
        max_length=1000,
        help_text=_(
            "The document type URL to use when creating the case for the destruction list deletion."
        ),
    )
    selectielijstklasse = models.URLField(
        "selectielijstklasse",
        blank=True,
        max_length=1000,
        help_text=_(
            "The selectielijstklasse URL to use when creating the case for the destruction list deletion."
        ),
    )

    class Meta:
        verbose_name = _("archive configuration")
        verbose_name_plural = _("archive configurations")

    def __str__(self):
        return "Archive configuration"


class APIConfig(SingletonModel):
    selectielijst_api_service = models.ForeignKey(
        to="zgw_consumers.Service",
        verbose_name=_("selectielijst API service"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=_("Which service to use to query the Selectielijst API."),
    )

    class Meta:
        verbose_name = _("API configuration")
        verbose_name_plural = _("API configurations")

    def __str__(self):
        return "API configuration"

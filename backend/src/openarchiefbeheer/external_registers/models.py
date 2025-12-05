from django.db import models
from django.utils.translation import gettext_lazy as _


class ExternalRegisterConfig(models.Model):
    identifier = models.CharField(
        verbose_name=_("identifier"),
        unique=True,
        help_text=_("Identifier that used as a reference from the plugin."),
    )
    enabled = models.BooleanField(
        verbose_name=_("enabled"),
        default=True,
        help_text=_("Specifies whether the Open Klant plugin is enabled."),
    )
    services = models.ManyToManyField(
        to="zgw_consumers.Service",
        verbose_name=_("Open Klant API services"),
        blank=True,
        help_text=_("Services to talk to Open Klant instances."),
    )

    class Meta:  # type: ignore
        verbose_name = _("External register plugin configuration")
        verbose_name_plural = _("External register plugin configurations")

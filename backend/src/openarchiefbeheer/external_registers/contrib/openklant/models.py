from django.db import models
from django.utils.translation import gettext_lazy as _

from solo.models import SingletonModel


class OpenKlantConfig(SingletonModel):
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

    _plugin_identifier = "openklant"

    class Meta:  # type: ignore
        verbose_name = _("Open Klant plugin configuration")
        verbose_name_plural = _("Open Klant plugin configurations")

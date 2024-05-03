from django.db import models
from django.utils.translation import gettext_lazy as _


class Zaak(models.Model):
    data = models.JSONField(
        verbose_name=_("data"),
        help_text=_("The data of the zaak, retrieved from Zaak API"),
    )

    class Meta:
        verbose_name = _("Zaak")
        verbose_name_plural = _("Zaken")

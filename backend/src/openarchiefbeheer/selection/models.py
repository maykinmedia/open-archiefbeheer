from django.db import models
from django.utils.translation import gettext_lazy as _


class SelectionItem(models.Model):
    key = models.CharField(
        _("key"),
        help_text=_(
            "The key to access this selection. "
            "It should be the uuid of a destruction list and an action name."
        ),
        max_length=250,
    )
    zaak_url = models.URLField(
        _("zaak url"), help_text=_("The url of a zaak in the list."), max_length=1000
    )
    selection_data = models.JSONField(
        _("selection data"),
        help_text=_("Data about this item in the selection"),
        default=dict,
    )

    class Meta:
        verbose_name = _("selection item")
        verbose_name_plural = _("selection items")


class AllSelectedToggle(models.Model):
    key = models.CharField(
        _("key"),
        help_text=_("The key to access this selection. "),
        max_length=250,
    )
    all_selected = models.BooleanField(
        _("all selected"),
        help_text=_("Toggle to set all the items in the selection to 'selected'."),
        default=False,
    )

    class Meta:
        verbose_name = _("all selected toggle")
        verbose_name_plural = _("all selected toggles")

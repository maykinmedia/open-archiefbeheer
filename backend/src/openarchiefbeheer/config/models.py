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
    )

    class Meta:
        verbose_name = _("archive configuration")
        verbose_name_plural = _("archive configurations")

    def __str__(self):
        return "Archive configuration"

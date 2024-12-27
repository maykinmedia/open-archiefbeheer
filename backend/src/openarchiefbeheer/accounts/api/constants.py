from django.db import models
from django.utils.translation import gettext_lazy as _


class RoleFilterChoices(models.TextChoices):
    record_manager = "record_manager", _("Record manager")
    main_reviewer = "main_reviewer", _("Main reviewer")
    co_reviewer = "co_reviewer", _("Co-reviewer")
    archivist = "archivist", _("Archivist")

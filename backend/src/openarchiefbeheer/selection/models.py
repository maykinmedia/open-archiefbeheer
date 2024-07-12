from django.db import models

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.zaken.models import Zaak


class ZaakSelection(models.Model):
    slug = models.SlugField(unique=True, max_length=255)
    last_updated = models.DateTimeField(auto_now=True)
    last_updated_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.slug


class ZaakSelectionItem(models.Model):
    zaak_selection = models.ForeignKey(ZaakSelection, on_delete=models.CASCADE, related_name='items')
    zaak = models.ForeignKey(Zaak, on_delete=models.CASCADE)
    selected = models.BooleanField()
    detail = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.zaak.url

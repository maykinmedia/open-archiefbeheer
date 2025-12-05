from django.apps import AppConfig
from django.db.models.signals import post_migrate

from .signals import populate_config_models


class ExternalRegisterAppConfig(AppConfig):
    name = "openarchiefbeheer.external_registers"

    def ready(self) -> None:
        from . import signals  # noqa

        post_migrate.connect(populate_config_models, sender=self)

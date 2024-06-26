from django.apps import AppConfig


class DestructionConfig(AppConfig):
    name = "openarchiefbeheer.destruction"
    verbose_name = "Open-archiefbeheer destruction"

    def ready(self):
        from . import signals  # noqa

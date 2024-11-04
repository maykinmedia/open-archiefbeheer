from django.apps import AppConfig


class SelectionConfig(AppConfig):
    name = "openarchiefbeheer.selection"
    verbose_name = "Open-archiefbeheer selection"

    def ready(self):
        from .api.drf_spectacular import extensions  # noqa

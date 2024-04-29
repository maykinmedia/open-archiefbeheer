from django.apps import AppConfig


class UtilsConfig(AppConfig):
    name = "openarchiefbeheer.utils"

    def ready(self):
        from . import checks  # noqa

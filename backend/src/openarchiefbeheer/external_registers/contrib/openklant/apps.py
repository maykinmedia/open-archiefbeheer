from django.apps import AppConfig


class OpenKlantPluginAppConfig(AppConfig):
    name = "openarchiefbeheer.external_registers.contrib.openklant"
    verbose_name = "Open Klant Plugin"

    def ready(self):
        from . import plugin  # noqa

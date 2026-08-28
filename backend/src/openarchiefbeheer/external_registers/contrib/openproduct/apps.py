from django.apps import AppConfig


class OpenProductPluginAppConfig(AppConfig):
    name = "openarchiefbeheer.external_registers.contrib.openproduct"
    verbose_name = "Open Product Plugin"

    def ready(self):
        from . import plugin  # noqa

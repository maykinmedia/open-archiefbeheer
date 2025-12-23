from django.apps import AppConfig


class ObjectenPluginAppConfig(AppConfig):
    name = "openarchiefbeheer.external_registers.contrib.objecten"
    verbose_name = "Objecten Plugin"

    def ready(self):
        from . import plugin  # noqa

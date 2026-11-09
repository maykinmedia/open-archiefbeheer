from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = "openarchiefbeheer.accounts"

    def ready(self):
        from . import signals, metrics  # noqa

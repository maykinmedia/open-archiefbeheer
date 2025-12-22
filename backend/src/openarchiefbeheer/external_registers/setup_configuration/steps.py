from abc import ABC, abstractmethod

from django_setup_configuration import BaseConfigurationStep, ConfigurationModel
from django_setup_configuration.exceptions import ConfigurationRunFailed
from zgw_consumers.models import Service

from openarchiefbeheer.external_registers.registry import register
from openarchiefbeheer.external_registers.setup_configuration.models import (
    ExternalRegisterConfigurationModel,
)

from .models import make_model_with_plugins


class ExternalRegisterPluginsConfigurationStep(
    BaseConfigurationStep[ConfigurationModel]
):
    """Configure the settings of the external registers.

    Note: the order in which the settings are configured is not fixed. But the settings don't depend on each other,
    so this should be okay.
    """

    enable_setting = "external_registers_enabled"
    namespace = "external_registers"
    verbose_name = "External registers"

    @property
    def config_model(self) -> type[ConfigurationModel]:  # pyright: ignore[reportIncompatibleVariableOverride]
        # This needs to run after initialisation, otherwise the risk is that not all plugins have been
        # added to the registry yet.
        return make_model_with_plugins()

    def execute(self, model: ConfigurationModel) -> None:
        for plugin in register.iter_automatically_configurable():
            assert plugin.setup_configuration_step
            step = plugin.setup_configuration_step()
            plugin_model = getattr(model, plugin.identifier)
            step.execute(plugin_model)


class ExternalRegisterPluginConfigurartionStep(
    BaseConfigurationStep[ExternalRegisterConfigurationModel], ABC
):
    config_model = ExternalRegisterConfigurationModel

    @property
    @abstractmethod
    def plugin_identifier(self) -> str: ...

    def execute(self, model: ExternalRegisterConfigurationModel) -> None:
        config = register[self.plugin_identifier].get_or_create_config()

        config.enabled = model.enabled
        existing_services = Service.objects.filter(
            slug__in=model.services_identifiers
        ).values_list("slug", "id")
        if existing_services.count():
            existing_services_slugs, existing_services_ids = zip(
                *existing_services, strict=True
            )
        else:
            existing_services_slugs = existing_services_ids = set()

        missing_services_slugs = set(model.services_identifiers) - set(
            existing_services_slugs
        )
        if missing_services_slugs:
            raise ConfigurationRunFailed(
                f"Missing services with slugs: {', '.join(sorted(missing_services_slugs))}."
                " Make sure they are already configured, manually or by first running the "
                "configuration step of `zgw_consumers`."
            )

        config.services.add(*existing_services_ids)
        config.save()

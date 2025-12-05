def populate_config_models(sender, **kwargs) -> None:
    from .registry import register as registry

    for _identifier, plugin in registry.iterate():
        plugin.get_or_create_config()

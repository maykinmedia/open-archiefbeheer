from openarchiefbeheer.config.tests.factories import SoloFactory

from ..models import OpenKlantConfig


class OpenKlantConfigFactory(SoloFactory):
    class Meta:  # type: ignore
        model = OpenKlantConfig

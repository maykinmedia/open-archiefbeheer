from openarchiefbeheer.tests.factories import SoloFactory

from ..models import EmailConfig


class EmailConfigFactory(SoloFactory[EmailConfig]):
    class Meta:
        model = EmailConfig

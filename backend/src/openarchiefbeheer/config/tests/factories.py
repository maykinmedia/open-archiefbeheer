import factory
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.tests.factories import SoloFactory

from ..models import APIConfig, ArchiveConfig


class APIConfigFactory(SoloFactory[APIConfig]):
    selectielijst_api_service = factory.SubFactory(  # pyright: ignore[reportPrivateImportUsage]
        ServiceFactory,
        api_root="https://selectielijst.openzaak.nl/api/v1",
        api_type=APITypes.orc,
    )

    class Meta:  # type: ignore
        model = APIConfig


class ArchiveConfigFactory(SoloFactory[ArchiveConfig]):
    class Meta:  # type: ignore
        model = ArchiveConfig

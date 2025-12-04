import factory
from factory.django import DjangoModelFactory
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from ..models import APIConfig, ArchiveConfig


# TODO: change to DjangoModelFactory[APIConfig]
class SoloFactory(DjangoModelFactory):
    # Use the `delete()` on the solo model as it clears the solo cache.
    # This avoids having to mock out the `get_solo()` method.
    @classmethod
    def _create(cls, model_class: type[APIConfig], *args, **kwargs):
        model_class.get_solo().delete()
        return super()._create(model_class, *args, **kwargs)


class APIConfigFactory(SoloFactory):
    selectielijst_api_service = factory.SubFactory(  # pyright: ignore[reportPrivateImportUsage]
        ServiceFactory,
        api_root="https://selectielijst.openzaak.nl/api/v1",
        api_type=APITypes.orc,
    )

    class Meta:  # type: ignore
        model = APIConfig


class ArchiveConfigFactory(SoloFactory):
    class Meta:  # type: ignore
        model = ArchiveConfig

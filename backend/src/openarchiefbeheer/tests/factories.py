from factory.django import DjangoModelFactory
from solo.models import SingletonModel


class SoloFactory[T: SingletonModel](DjangoModelFactory):
    # Use the `delete()` on the solo model as it clears the solo cache.
    # This avoids having to mock out the `get_solo()` method.
    @classmethod
    def _create(cls, model_class: type[T], *args, **kwargs) -> T:
        model_class.get_solo().delete()
        return super()._create(model_class, *args, **kwargs)

import factory

from ..models import Zaak


def zaak_data(number: int) -> dict:
    return {
        "url": f"http://zaken-api.nl/zaken/api/v1/zaken/{number}",
        "identificatie": f"ZAAK-{number}",
    }


class ZaakFactory(factory.django.DjangoModelFactory):
    data = factory.Sequence(zaak_data)

    class Meta:
        model = Zaak

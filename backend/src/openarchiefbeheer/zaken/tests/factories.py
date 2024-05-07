from datetime import date
from uuid import uuid4

import factory
from factory.fuzzy import FuzzyAttribute, FuzzyDate

from ..models import Zaak


class ZaakFactory(factory.django.DjangoModelFactory):
    uuid = FuzzyAttribute(uuid4)
    url = factory.Sequence(lambda number: f"http://zaken-api.nl/zaken/{number}")
    identificatie = factory.Sequence(lambda number: f"ZAAK-{number}")
    startdatum = FuzzyDate(date(2000, 1, 1))
    zaaktype = factory.Sequence(
        lambda number: f"http://catalogue-api.nl/zaaktypen/{number}"
    )
    bronorganisatie = "000000000"
    verantwoordelijke_organisatie = "000000000"

    class Meta:
        model = Zaak

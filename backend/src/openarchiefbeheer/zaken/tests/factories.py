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

    class Params:
        with_expand = factory.Trait(
            _expand={
                "zaaktype": {
                    "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                    "selectielijst_procestype": {"nummer": 1},
                },
                "resultaat": {
                    "resultaattype": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                            "archiefactietermijn": "P1D",
                        }
                    },
                },
            }
        )
        with_related_zaken = factory.Trait(
            relevante_andere_zaken=[
                "http://zaken-api.nl/zaken/api/v1/zaken/111-111-111",
                "http://zaken-api.nl/zaken/api/v1/zaken/222-222-222",
            ]
        )

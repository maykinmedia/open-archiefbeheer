import copy
from datetime import date, timedelta
from uuid import uuid4

import factory
from factory import post_generation
from factory.fuzzy import FuzzyAttribute, FuzzyDate
from faker import Faker

from ..models import Zaak


class ZaakFactory(factory.django.DjangoModelFactory):
    uuid = FuzzyAttribute(uuid4)
    url = factory.LazyAttribute(lambda obj: f"http://zaken-api.nl/zaken/{obj.uuid}")
    identificatie = factory.Sequence(lambda number: f"ZAAK-{number}")
    startdatum = FuzzyDate(date(2000, 1, 1), date(2022, 1, 1))
    zaaktype = factory.Sequence(
        lambda number: f"http://catalogue-api.nl/zaaktypen/{number}"
    )
    bronorganisatie = "000000000"
    verantwoordelijke_organisatie = "000000000"
    einddatum = factory.LazyAttribute(lambda obj: obj.startdatum + timedelta(days=365))
    archiefactiedatum = factory.LazyAttribute(
        lambda obj: obj.einddatum + timedelta(days=365)
    )

    class Meta:
        model = Zaak

    class Params:
        with_related_zaken = factory.Trait(
            relevante_andere_zaken=[
                "http://zaken-api.nl/zaken/api/v1/zaken/111-111-111",
                "http://zaken-api.nl/zaken/api/v1/zaken/222-222-222",
            ]
        )

    @post_generation
    def post(obj, create, extracted, **kwargs):  # noqa: N805
        expand = copy.deepcopy(
            {
                "zaaktype": {
                    "url": obj.zaaktype,
                    "selectielijst_procestype": {
                        "nummer": 1,
                        "url": "https://selectielijst.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                        "naam": "Evaluatie uitvoeren",
                        "jaar": 2024,
                    },
                    "omschrijving": Faker().sentence(),
                    "identificatie": kwargs.get(
                        "_expand__zaaktype__identificatie",
                        obj.identificatie.replace("ZAAK", "ZAAKTYPE"),
                    ),
                    "versiedatum": "2024-01-01",
                },
                "resultaat": {
                    "url": "http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111",
                    "resultaattype": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                            "archiefactietermijn": "P1D",
                            "omschrijving": "This is a result type",
                            "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/78e12133-c467-4202-91ba-4417baa52801",
                        }
                    },
                },
            }
        )
        expand.update(kwargs.get("_expand", {}))

        obj._expand = expand
        obj.save()

import copy
from datetime import date, timedelta
from uuid import uuid4

import factory
from factory import post_generation
from factory.fuzzy import FuzzyAttribute, FuzzyDate

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
    def post(obj, create, extracted, **kwargs):
        expand = copy.deepcopy(
            {
                "zaaktype": {
                    "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                    "selectielijst_procestype": {
                        "nummer": 1,
                        "url": "https://selectielijst.nl/api/v1/procestypen/7ff2b005-4d84-47fe-983a-732bfa958ff5",
                    },
                    "omschrijving": "Aangifte behandelen",
                    "identificatie": "ZAAKTYPE-01",
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
        expand.update(kwargs.get("_expand", {}))

        obj._expand = expand
        obj.save()

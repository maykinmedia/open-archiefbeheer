from django.test import TestCase, tag

from vcr.unittest import VCRMixin
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.tests.factories import APIConfigFactory
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin

from ..api.serializers import ZaakMetadataSerializer
from .factories import ZaakFactory


@tag("vcr")
class ZaakSerialisersTests(ClearCacheMixin, VCRMixin, TestCase):
    def test_selectielijstklasse(self):
        APIConfigFactory.create()
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

        zaak = ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/fe192229-0998-49cd-95e5-ec5de32e512a",
            uuid="fe192229-0998-49cd-95e5-ec5de32e512a",
            selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/cc5ae4e3-a9e6-4386-bcee-46be4986a829",
        )

        serialiser = ZaakMetadataSerializer(instance=zaak)

        self.assertEqual(
            serialiser.data["selectielijstklasse"],
            "1.1 - Ingericht - vernietigen - P10Y (2017)",
        )
        self.assertEqual(serialiser.data["selectielijstklasse_versie"], "2017")

    def test_selectielijstklasse_overwrite(self):
        APIConfigFactory.create()
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
            client_id="test-vcr",
            secret="test-vcr",
        )

        zaak = ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/fe192229-0998-49cd-95e5-ec5de32e512a",
            uuid="fe192229-0998-49cd-95e5-ec5de32e512a",
            selectielijstklasse="https://selectielijst.openzaak.nl/api/v1/resultaten/cc5ae4e3-a9e6-4386-bcee-46be4986a829",
            post___expand={
                "resultaat": {
                    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
                    "_expand": {
                        "resultaattype": {
                            "url": "http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
                            "omschrijving": "Afgehandeld",
                            "selectielijstklasse": "https://selectielijst.openzaak.nl/api/v1/resultaten/1bb001e9-5eab-4f10-8940-8781e11f180f",
                        }
                    },
                }
            },
        )

        serialiser = ZaakMetadataSerializer(instance=zaak)

        # NOT `5 - Toezicht uitgevoerd - vernietigen - P5Y (2020)`
        # as would be the label of the selectielijstklasse from the resultaat -> resultaattype -> selectielijstklasse
        self.assertEqual(
            serialiser.data["selectielijstklasse"],
            "1.1 - Ingericht - vernietigen - P10Y (2017)",
        )
        self.assertEqual(serialiser.data["selectielijstklasse_versie"], "2017")

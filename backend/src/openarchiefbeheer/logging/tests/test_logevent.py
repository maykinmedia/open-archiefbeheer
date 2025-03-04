from datetime import date

from django.test import TestCase, tag

from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.tests.factories import (
    DestructionListFactory,
    DestructionListItemFactory,
)
from openarchiefbeheer.logging import logevent


class LogEventTests(TestCase):
    def test_destruction_list_ready_for_first_review(self):
        user = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            comment="A list to test logging data.", author=user
        )
        items = DestructionListItemFactory.create_batch(
            3, destruction_list=destruction_list, with_zaak=True
        )
        items[0].zaak._expand = {
            "zaaktype": {
                "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                "identificatie": "ZAAKTYPE-01",
                "omschrijving": "ZAAKTYPE 1.0",
                "versiedatum": "2024-01-01",
            },
            "resultaat": {
                "url": "http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111",
                "toelichting": "Completed.",
                "_expand": {
                    "resultaattype": {
                        "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                        "omschrijving": "Completed.",
                    }
                },
            },
        }
        items[1].zaak._expand = {
            "zaaktype": {  # Different version of the zaaktype above
                "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/222-222-222",
                "identificatie": "ZAAKTYPE-01",
                "omschrijving": "ZAAKTYPE 1.1",
                "versiedatum": "2024-01-02",
            },
            "resultaat": {
                "url": "http://zaken-api.nl/zaken/api/v1/resultaten/111-111-111",
                "toelichting": "Completed.",
                "_expand": {
                    "resultaattype": {
                        "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                        "omschrijving": "Completed.",
                    }
                },
            },
        }
        items[2].zaak._expand = {
            "zaaktype": {
                "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/333-333-333",
                "identificatie": "ZAAKTYPE-02",
                "omschrijving": "ZAAKTYPE 2.0",
                "versiedatum": "2024-01-01",
            },
            "resultaat": {
                "url": "http://zaken-api.nl/zaken/api/v1/resultaten/222-222-222",
                "toelichting": "Abandoned.",
                "_expand": {
                    "resultaattype": {
                        "url": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/222-222-222",
                        "omschrijving": "Abandoned.",
                    }
                },
            },
        }

        items[0].zaak.archiefactiedatum = date(2000, 1, 1)
        items[1].zaak.archiefactiedatum = date(2005, 1, 1)
        items[2].zaak.archiefactiedatum = date(2010, 1, 1)

        items[0].zaak.archiefnominatie = "vernietigen"
        items[1].zaak.archiefnominatie = "vernietigen"
        items[2].zaak.archiefnominatie = "blijvend_bewaren"

        items[0].zaak.save()
        items[1].zaak.save()
        items[2].zaak.save()

        logevent.destruction_list_ready_for_first_review(destruction_list, user)

        log = TimelineLog.objects.for_object(destruction_list)[0]

        extra_data = log.extra_data

        self.assertEqual(extra_data["min_archiefactiedatum"], "2000-01-01")
        self.assertEqual(extra_data["max_archiefactiedatum"], "2010-01-01")
        self.assertEqual(
            sorted(extra_data["zaaktypen"], key=lambda choice: choice["label"]),
            [
                {
                    "label": "ZAAKTYPE 1.1 (ZAAKTYPE-01)",
                    "value": "ZAAKTYPE-01",
                },
                {
                    "label": "ZAAKTYPE 2.0 (ZAAKTYPE-02)",
                    "value": "ZAAKTYPE-02",
                },
            ],
        )
        self.assertEqual(
            sorted(extra_data["resultaten"], key=lambda choice: choice["label"]),
            [
                {
                    "label": "Abandoned.",
                    "value": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/222-222-222",
                    "extra_data": {"toelichting": "Abandoned."},
                },
                {
                    "label": "Completed.",
                    "value": "http://catalogue-api.nl/catalogi/api/v1/resultaattypen/111-111-111",
                    "extra_data": {"toelichting": "Completed."},
                },
            ],
        )
        self.assertEqual(
            sorted(extra_data["archiefnominaties"]), ["blijvend_bewaren", "vernietigen"]
        )
        self.assertEqual(extra_data["comment"], "A list to test logging data.")
        self.assertEqual(extra_data["number_of_zaken"], 3)

    @tag("gh-539")
    def test_resultaat_of_zaak_can_be_not_set(self):
        user = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            comment="A list to test logging data.", author=user
        )
        item = DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
        )
        item.zaak._expand = {
            "zaaktype": {
                "url": "http://catalogi-api.nl/catalogi/api/v1/zaakypen/111-111-111",
                "identificatie": "ZAAKTYPE-01",
                "omschrijving": "ZAAKTYPE 1.0",
                "versiedatum": "2024-01-01",
            },
            # No resultaat present
        }
        item.zaak.save()

        logevent.destruction_list_ready_for_first_review(destruction_list, user)

        log = TimelineLog.objects.for_object(destruction_list)[0]

        self.assertEqual(
            log.extra_data["resultaten"],
            [],
        )

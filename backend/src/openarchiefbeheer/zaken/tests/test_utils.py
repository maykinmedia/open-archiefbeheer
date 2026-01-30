from django.test import TestCase
from django.utils.translation import gettext_lazy as _

from openarchiefbeheer.zaken.utils import (
    format_zaaktype_choices,
)


class FormatZaaktypeChoicesTests(TestCase):
    def test_format_zaaktype_choices_with_no_identificatie(self):
        # Test how the function handles zaaktypen with no identificatie
        zaaktypen = [
            {
                "identificatie": None,
                "url": "http://localhost:8000/api/v1/zaaktypen/1",
                "omschrijving": "Zaaktype without ID",
                "versiedatum": "2023-01-01",
            }
        ]

        # Should fall back to using "no identificatie" in the label
        default_identificatie = _("no identificatie")
        expected_result = [
            {
                "label": f"Zaaktype without ID ({default_identificatie})",
                "value": "",
            }
        ]

        result = format_zaaktype_choices(zaaktypen)
        self.assertEqual(result, expected_result)

    def test_format_zaaktype_choices_with_empty_input(self):
        # Test the behavior with an empty input list
        zaaktypen = []
        expected_result = []

        # Should return an empty list
        result = format_zaaktype_choices(zaaktypen)
        self.assertEqual(result, expected_result)

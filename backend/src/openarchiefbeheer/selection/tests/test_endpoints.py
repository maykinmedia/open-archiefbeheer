from rest_framework import status
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..models import AllSelectedToggle, SelectionItem
from .factories import SelectionItemFactory


class SelectionAPITests(APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls.user = UserFactory.create(is_staff=True, is_superuser=True)

    def test_get_zaak_selection(self):
        key = "some-key"
        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        self.client.force_login(self.user)

        response = self.client.get(f"/api/v1/selection/{key}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertFalse(data["http://zaken.nl/api/v1/zaken/111-111-111"]["selected"])
        self.assertTrue(data["http://zaken.nl/api/v1/zaken/222-222-222"]["selected"])
        self.assertFalse(data["http://zaken.nl/api/v1/zaken/333-333-333"]["selected"])

    def test_set_zaak_selection(self):
        key = "some-key"

        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        self.client.force_login(self.user)

        response = self.client.patch(
            f"/api/v1/selection/{key}",
            data={
                "http://zaken.nl/api/v1/zaken/111-111-111": {"selected": True},
                "http://zaken.nl/api/v1/zaken/222-222-222": {"selected": False},
                "http://zaken.nl/api/v1/zaken/333-333-333": {"details": {"bla": "blo"}},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertTrue(data["http://zaken.nl/api/v1/zaken/111-111-111"]["selected"])
        self.assertFalse(data["http://zaken.nl/api/v1/zaken/222-222-222"]["selected"])
        self.assertFalse(data["http://zaken.nl/api/v1/zaken/333-333-333"]["selected"])
        self.assertEqual(
            data["http://zaken.nl/api/v1/zaken/333-333-333"]["details"], {"bla": "blo"}
        )

    def test_clear_zaak_selection(self):
        key = "some-key"

        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        self.client.force_login(self.user)
        response = self.client.delete(f"/api/v1/selection/{key}")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        selection_items = SelectionItem.objects.filter(key=key)

        self.assertFalse(selection_items.exists())

    def test_get_filtered_zaak_selection(self):
        key = "some-key"

        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        item2 = SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        item3 = SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        item2.selection_data["details"] = {"test": "trololo"}
        item3.selection_data["details"] = {"test": "tralala"}

        self.client.force_login(self.user)
        response = self.client.get(
            f"/api/v1/selection/{key}?selected=True&test=tralala"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data.keys()), 1)
        self.assertEqual(data.keys()[0], "http://zaken.nl/api/v1/zaken/333-333-333")

    def test_get_selection_item(self):
        key = "some-key"

        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        self.client.force_login(self.user)
        response = self.client.get(
            f"/api/v1/selection/{key}?item=http://zaken.nl/api/v1/zaken/111-111-111"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data, {"selected": False, "details": {}})

    def test_set_all_zaken_selected(self):
        key = "some-key"

        self.client.force_login(self.user)
        response = self.client.post(f"/api/v1/selection/{key}/select_all")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        toggle = AllSelectedToggle.objects.filter(key=key)

        self.assertTrue(toggle.exists())
        self.assertTrue(toggle.first().all_selected)

    def test_get_selection_size(self):
        key = "some-key"

        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        self.client.force_login(self.user)
        response = self.client.get(f"/api/v1/selection/{key}/count")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 2)

        # Now toggle select_all on
        response = self.client.post(f"/api/v1/selection/{key}/select_all")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(f"/api/v1/selection/{key}/count")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 3)

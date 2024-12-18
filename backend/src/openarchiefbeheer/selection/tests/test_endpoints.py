from unittest.mock import patch

from django.test import tag
from django.utils.translation import gettext_lazy as _

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
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

        response = self.client.post(reverse("api:selections", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertFalse(data["http://zaken.nl/api/v1/zaken/111-111-111"]["selected"])
        self.assertTrue(data["http://zaken.nl/api/v1/zaken/222-222-222"]["selected"])
        self.assertFalse(data["http://zaken.nl/api/v1/zaken/333-333-333"]["selected"])

    def test_create_zaak_selection(self):
        key = "some-key"

        data = {
            "http://zaken.nl/api/v1/zaken/111-111-111": {"selected": True},
            "http://zaken.nl/api/v1/zaken/222-222-222": {"selected": False},
            "http://zaken.nl/api/v1/zaken/333-333-333": {
                "selected": False,
                "detail": {"bla": "blo"},
            },
        }

        self.client.force_login(self.user)

        response = self.client.put(
            reverse("api:selections", args=[key]),
            data=data,
            format="json",
        )

        self.assertEqual(status.HTTP_200_OK, response.status_code)

        items = SelectionItem.objects.filter(key=key)

        self.assertEqual(items.count(), 3)

    def test_full_update_zaak_selection(self):
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

        data = {
            "http://zaken.nl/api/v1/zaken/111-111-111": {"selected": True},
            "http://zaken.nl/api/v1/zaken/222-222-222": {"selected": True},
            "http://zaken.nl/api/v1/zaken/333-333-333": {
                "selected": False,
                "detail": {"bla": "Changed detail!"},
            },
        }

        self.client.force_login(self.user)

        response = self.client.put(
            reverse("api:selections", args=[key]),
            data=data,
            format="json",
        )

        self.assertEqual(status.HTTP_200_OK, response.status_code)

        items = SelectionItem.objects.filter(key=key)

        self.assertEqual(items.count(), 3)
        self.assertTrue(
            items.get(
                zaak_url="http://zaken.nl/api/v1/zaken/111-111-111"
            ).selection_data["selected"]
        )
        self.assertEqual(
            items.get(
                zaak_url="http://zaken.nl/api/v1/zaken/333-333-333"
            ).selection_data["detail"],
            {"bla": "Changed detail!"},
        )

    def test_set_zaak_selection(self):
        key = "some-key"

        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        self.client.force_login(self.user)

        response = self.client.patch(
            reverse("api:selections", args=[key]),
            data={
                "http://zaken.nl/api/v1/zaken/111-111-111": {"selected": True},
                "http://zaken.nl/api/v1/zaken/222-222-222": {"selected": False},
                "http://zaken.nl/api/v1/zaken/333-333-333": {"detail": {"bla": "blo"}},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertTrue(data["http://zaken.nl/api/v1/zaken/111-111-111"]["selected"])
        self.assertFalse(data["http://zaken.nl/api/v1/zaken/222-222-222"]["selected"])
        self.assertFalse(data["http://zaken.nl/api/v1/zaken/333-333-333"]["selected"])
        self.assertEqual(
            data["http://zaken.nl/api/v1/zaken/333-333-333"]["detail"], {"bla": "blo"}
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
        response = self.client.delete(reverse("api:selections", args=[key]))

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
        item4 = SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        item2.selection_data["detail"].update({"test": "trololo"})
        item3.selection_data["detail"].update({"test": "tralala", "annotated": True})
        item4.selection_data["detail"].update({"test": "tralala", "annotated": False})
        item2.save()
        item3.save()

        self.client.force_login(self.user)
        endpoint = furl(reverse("api:selections", args=[key]))
        endpoint.args["selected"] = True
        endpoint.args["annotated"] = True
        endpoint.args["test"] = "tralala"

        response = self.client.post(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data.keys()), 1)
        self.assertEqual(
            list(data.keys())[0], "http://zaken.nl/api/v1/zaken/333-333-333"
        )

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
        endpoint = furl(reverse("api:selections", args=[key]))
        endpoint.args["items"] = "http://zaken.nl/api/v1/zaken/111-111-111"
        response = self.client.post(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(
            data,
            {
                "http://zaken.nl/api/v1/zaken/111-111-111": {
                    "selected": False,
                    "detail": {},
                }
            },
        )

    def test_filter_items(self):
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
        endpoint = furl(reverse("api:selections", args=[key]))
        endpoint.args["items"] = (
            "http://zaken.nl/api/v1/zaken/111-111-111,http://zaken.nl/api/v1/zaken/222-222-222"
        )
        response = self.client.post(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(
            data,
            {
                "http://zaken.nl/api/v1/zaken/111-111-111": {
                    "selected": False,
                    "detail": {},
                },
                "http://zaken.nl/api/v1/zaken/222-222-222": {
                    "selected": True,
                    "detail": {},
                },
            },
        )

    def test_set_all_zaken_selected(self):
        key = "some-key"

        self.client.force_login(self.user)
        response = self.client.post(reverse("api:selections-select-all", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        toggle = AllSelectedToggle.objects.filter(key=key)

        self.assertTrue(toggle.exists())
        self.assertTrue(toggle.first().all_selected)

    def test_get_selected_all_toggle(self):
        key = "some-key"

        self.client.force_login(self.user)
        response = self.client.get(reverse("api:selections-select-all", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["allSelected"])

    def test_clear_select_all_toggle(self):
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
        AllSelectedToggle.objects.create(key=key, all_selected=True)

        # Now toggle select_all off
        self.client.force_login(self.user)
        response = self.client.delete(reverse("api:selections-select-all", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        response = self.client.get(reverse("api:selections-count", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 2)

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
        response = self.client.get(reverse("api:selections-count", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 2)

        # Now toggle select_all on, the count should not change!
        response = self.client.post(reverse("api:selections-select-all", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(reverse("api:selections-count", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 2)

    def test_get_selection_size_with_filters(self):
        key = "some-key"

        SelectionItemFactory.create(
            key=key,
            selection_data={"selected": False, "detail": {"some-detail": "oh!"}},
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )
        SelectionItemFactory.create(
            key=key,
            selection_data={"selected": True, "detail": {"some-detail": "oh!"}},
            zaak_url="http://zaken.nl/api/v1/zaken/222-222-222",
        )
        SelectionItemFactory.create(
            key=key,
            is_selected=True,
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
        )

        self.client.force_login(self.user)
        endpoint = furl(reverse("api:selections-count", args=[key]))
        endpoint.args["some-detail"] = "oh!"
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["count"], 1)

    def test_too_large_selection_data(self):
        key = "some-key"

        data = {
            "http://zaken.nl/api/v1/zaken/333-333-333": {
                "selected": False,
                "detail": {"data": "This is toooooo laaaaarge"},
            },
        }

        self.client.force_login(self.user)

        with patch(
            "openarchiefbeheer.selection.api.serializers.MAX_SELECTION_DATA_SIZE", 10
        ):
            response = self.client.put(
                reverse("api:selections", args=[key]),
                data=data,
                format="json",
            )

        self.assertEqual(status.HTTP_400_BAD_REQUEST, response.status_code)

        errors = response.json()

        self.assertEqual(
            errors[0]["selection_data"][0],
            _("Too much data passed, limit is %(max_size)s bytes") % {"max_size": 10},
        )

    def test_urls_not_camelised(self):
        key = "some_key"
        SelectionItemFactory.create(
            key=key,
            zaak_url="http://zaken.nl/api/v1/zaken/should_not_be_camelised",
        )

        self.client.force_login(self.user)

        response = self.client.post(reverse("api:selections", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertIn("http://zaken.nl/api/v1/zaken/should_not_be_camelised", data)

    def test_urls_not_snakelised(self):
        key = "someKey"

        data = {
            "http://zaken.nl/api/v1/zaken/shouldNotBeSnakeCase": {"selected": True},
        }

        self.client.force_login(self.user)

        response = self.client.put(
            reverse("api:selections", args=[key]),
            data=data,
            format="json",
        )

        self.assertEqual(status.HTTP_200_OK, response.status_code)

        items = SelectionItem.objects.filter(key=key)

        self.assertEqual(
            items.first().zaak_url, "http://zaken.nl/api/v1/zaken/shouldNotBeSnakeCase"
        )

    @tag("gh-493")
    def test_options_method(self):
        key = "some-key"
        SelectionItemFactory.create(
            key=key,
            is_selected=False,
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
        )

        self.client.force_login(self.user)

        response = self.client.options(reverse("api:selections", args=[key]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

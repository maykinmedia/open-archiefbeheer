from datetime import date
from uuid import uuid4

from openarchiefbeheer.destruction.constants import ListItemStatus
from openarchiefbeheer.utils.tests.migrations_tests import TestMigrations


class TestAddZaakMigration(TestMigrations):
    app = "destruction"
    migrate_from = "0016_alter_destructionlistitem_unique_together_and_more"
    migrate_to = "0017_destructionlistitem_zaak"

    def setUpBeforeMigration(self, apps):
        Zaak = apps.get_model("zaken", "Zaak")
        DestructionListItem = apps.get_model("destruction", "DestructionListItem")
        DestructionList = apps.get_model("destruction", "DestructionList")
        User = apps.get_model("accounts", "User")

        Zaak.objects.create(
            uuid=str(uuid4()),
            url="http://zaken.nl/api/v1/zaken/111-111-111",
            startdatum=date(2000, 1, 1),
            zaaktype="http://catalogue-api.nl/zaaktypen/111-111-111",
            bronorganisatie="000000000",
            verantwoordelijke_organisatie="000000000",
        )
        Zaak.objects.create(
            uuid=str(uuid4()),
            url="http://zaken.nl/api/v1/zaken/222-222-222",
            startdatum=date(2000, 1, 1),
            zaaktype="http://catalogue-api.nl/zaaktypen/111-111-111",
            bronorganisatie="000000000",
            verantwoordelijke_organisatie="000000000",
        )
        Zaak.objects.create(
            uuid=str(uuid4()),
            url="http://zaken.nl/api/v1/zaken/333-333-333",
            startdatum=date(2000, 1, 1),
            zaaktype="http://catalogue-api.nl/zaaktypen/111-111-111",
            bronorganisatie="000000000",
            verantwoordelijke_organisatie="000000000",
        )
        destruction_list = DestructionList.objects.create(
            name="Test migration",
            author=User.objects.create(username="recordmanager"),
        )
        DestructionListItem.objects.create(
            zaak_url="http://zaken.nl/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
            destruction_list_id=destruction_list.pk,
        )
        DestructionListItem.objects.create(
            zaak_url="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
            destruction_list_id=destruction_list.pk,
        )
        DestructionListItem.objects.create(
            zaak_url="http://zaken.nl/api/v1/zaken/333-333-333",
            status=ListItemStatus.removed,
            destruction_list_id=destruction_list.pk,
        )

        self.destruction_list = destruction_list

    def test_new_link_to_zaak(self):
        DestructionListItem = self.apps.get_model("destruction", "DestructionListItem")

        items = DestructionListItem.objects.filter(
            destruction_list_id=self.destruction_list.pk
        )

        for item in items:
            self.assertIsNotNone(item.zaak)
            self.assertEqual(item.zaak.url, item.zaak_url)


class TestAddZaakBackwardsMigration(TestMigrations):
    app = "destruction"
    migrate_to = "0016_alter_destructionlistitem_unique_together_and_more"
    migrate_from = "0017_destructionlistitem_zaak"

    def setUpBeforeMigration(self, apps):
        Zaak = apps.get_model("zaken", "Zaak")
        DestructionListItem = apps.get_model("destruction", "DestructionListItem")
        DestructionList = apps.get_model("destruction", "DestructionList")
        User = apps.get_model("accounts", "User")

        zaak1 = Zaak.objects.create(
            uuid=str(uuid4()),
            url="http://zaken.nl/api/v1/zaken/111-111-111",
            startdatum=date(2000, 1, 1),
            zaaktype="http://catalogue-api.nl/zaaktypen/111-111-111",
            bronorganisatie="000000000",
            verantwoordelijke_organisatie="000000000",
        )
        zaak2 = Zaak.objects.create(
            uuid=str(uuid4()),
            url="http://zaken.nl/api/v1/zaken/222-222-222",
            startdatum=date(2000, 1, 1),
            zaaktype="http://catalogue-api.nl/zaaktypen/111-111-111",
            bronorganisatie="000000000",
            verantwoordelijke_organisatie="000000000",
        )
        zaak3 = Zaak.objects.create(
            uuid=str(uuid4()),
            url="http://zaken.nl/api/v1/zaken/333-333-333",
            startdatum=date(2000, 1, 1),
            zaaktype="http://catalogue-api.nl/zaaktypen/111-111-111",
            bronorganisatie="000000000",
            verantwoordelijke_organisatie="000000000",
        )
        destruction_list = DestructionList.objects.create(
            name="Test migration",
            author=User.objects.create(username="recordmanager"),
        )
        DestructionListItem.objects.create(
            zaak=zaak1,
            status=ListItemStatus.suggested,
            destruction_list_id=destruction_list.pk,
        )
        DestructionListItem.objects.create(
            zaak=zaak2,
            status=ListItemStatus.suggested,
            destruction_list_id=destruction_list.pk,
        )
        DestructionListItem.objects.create(
            zaak=zaak3,
            status=ListItemStatus.removed,
            destruction_list_id=destruction_list.pk,
        )

        self.destruction_list = destruction_list

    def test_zaak_url_repopulated(self):
        DestructionListItem = self.apps.get_model("destruction", "DestructionListItem")

        items = DestructionListItem.objects.filter(
            destruction_list_id=self.destruction_list.pk
        ).order_by("zaak_url")

        self.assertEqual(items[0].zaak_url, "http://zaken.nl/api/v1/zaken/111-111-111")
        self.assertEqual(items[1].zaak_url, "http://zaken.nl/api/v1/zaken/222-222-222")
        self.assertEqual(items[2].zaak_url, "http://zaken.nl/api/v1/zaken/333-333-333")

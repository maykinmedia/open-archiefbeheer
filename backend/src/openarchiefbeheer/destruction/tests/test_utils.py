from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase

from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import ListRole
from ..models import DestructionListItem
from ..utils import process_new_reviewer, resync_items_and_zaken
from .factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
)


class UtilsTest(TestCase):
    def test_process_assignees(self):
        destruction_list = DestructionListFactory.create()
        DestructionListAssigneeFactory.create_batch(
            3, role=ListRole.main_reviewer, destruction_list=destruction_list
        )

        new_reviewer = UserFactory.create(post__can_review_destruction=True)

        process_new_reviewer(destruction_list, new_reviewer)

        reviewer = destruction_list.assignees.get(role=ListRole.main_reviewer)

        self.assertEqual(new_reviewer.pk, reviewer.user.pk)

    def test_resync_zaken(self):
        ZaakFactory.create(url="http://zaken.nl/1")
        ZaakFactory.create(url="http://zaken.nl/2")
        item1 = DestructionListItemFactory.create(_zaak_url="http://zaken.nl/1")
        item2 = DestructionListItemFactory.create(_zaak_url="http://zaken.nl/2")

        resync_items_and_zaken()

        item1.refresh_from_db()
        item2.refresh_from_db()

        self.assertIsNotNone(item1.zaak)
        self.assertEqual(item1.zaak.url, "http://zaken.nl/1")
        self.assertIsNotNone(item2.zaak)
        self.assertEqual(item2.zaak.url, "http://zaken.nl/2")

    def test_resync_zaken_missing(self):
        ZaakFactory.create(url="http://zaken.nl/1")
        ZaakFactory.create(url="http://zaken.nl/2")
        item1 = DestructionListItemFactory.create(_zaak_url="http://zaken.nl/1")
        item2 = DestructionListItemFactory.create(_zaak_url="http://zaken.nl/3")
        item2_pk = item2.pk
        destruction_list2 = item2.destruction_list

        resync_items_and_zaken()

        item1.refresh_from_db()

        self.assertIsNotNone(item1.zaak)
        self.assertEqual(item1.zaak.url, "http://zaken.nl/1")
        with self.assertRaises(ObjectDoesNotExist):
            DestructionListItem.objects.get(pk=item2_pk)

        logs = TimelineLog.objects.for_object(destruction_list2)

        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs[0].extra_data["number_deleted_items"], 1)
        self.assertEqual(logs[0].extra_data["number_of_zaken"], 0)

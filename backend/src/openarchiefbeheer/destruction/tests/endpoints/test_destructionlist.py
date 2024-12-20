from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import ListStatus
from ...models import DestructionList
from ..factories import DestructionListFactory


class DestructionListViewsetTests(APITestCase):
    def test_not_record_manager_cannot_delete(self):
        user = UserFactory.create(post__can_start_destruction=False)

        destruction_list = DestructionListFactory.create(status=ListStatus.new)

        self.client.force_login(user)
        response = self.client.delete(
            reverse(
                "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
            )
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_not_new_cannot_be_deleted(self):
        user = UserFactory.create(post__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review
        )

        self.client.force_login(user)
        response = self.client.delete(
            reverse(
                "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
            )
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_record_manager_can_delete_new_list(self):
        user = UserFactory.create(post__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(status=ListStatus.new)
        list_uuid = destruction_list.uuid

        self.client.force_login(user)
        response = self.client.delete(
            reverse(
                "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
            )
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DestructionList.objects.filter(uuid=list_uuid).exists())

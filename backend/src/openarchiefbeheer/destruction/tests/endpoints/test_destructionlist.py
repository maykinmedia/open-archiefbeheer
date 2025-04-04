from datetime import date
from unittest.mock import patch

from django.utils.translation import gettext as _

from freezegun import freeze_time
from requests_mock import Mocker
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ...constants import InternalStatus, ListRole, ListStatus
from ...models import DestructionList
from ..factories import DestructionListAssigneeFactory, DestructionListFactory


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

    def test_cannot_download_report_if_not_record_manager(self):
        user = UserFactory.create(post__can_start_destruction=False)
        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_download_report_if_not_deleted(self):
        user = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="A not-deleted list",
            status=ListStatus.new,
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_destruction_report_url(self):
        user = UserFactory.create(post__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @Mocker()
    def test_destruction_report_url_in_internal_result(self, m):
        user = UserFactory.create(post__can_start_destruction=True)
        ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
        )
        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
            internal_results={
                "created_resources": {
                    "enkelvoudiginformatieobjecten": [
                        "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/61a914a2-db24-4a53-acbc-5306e5c346a6"
                    ]
                }
            },
        )

        m.get(
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/61a914a2-db24-4a53-acbc-5306e5c346a6/download"
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @Mocker()
    def test_destruction_report_url_retrieved_from_openzaak(self, m):
        user = UserFactory.create(post__can_start_destruction=True)
        ServiceFactory.create(
            api_type=APITypes.drc,
            api_root="http://localhost:8003/documenten/api/v1",
        )
        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )
        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
            zaak_destruction_report_url="http://localhost:8003/zaken/api/v1/zaken/c1490adc-adf7-4e0a-97a7-fa3cd94b8ddf",
        )

        m.get(
            "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/61a914a2-db24-4a53-acbc-5306e5c346a6/download"
        )
        m.get(
            "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten?zaak=http://localhost:8003/zaken/api/v1/zaken/c1490adc-adf7-4e0a-97a7-fa3cd94b8ddf",
            json=[
                {
                    "informatieobject": "http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/61a914a2-db24-4a53-acbc-5306e5c346a6"
                }
            ],
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse(
                "api:destructionlist-download-report",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_assign_author_as_reviewer_when_logged_in_as_other_record_manager(self):
        record_manager1 = UserFactory.create(
            post__can_start_destruction=True, post__can_review_destruction=True
        )
        record_manager2 = UserFactory.create(post__can_start_destruction=True)
        reviewer = UserFactory.create(post__can_review_destruction=True)

        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review,
            author=record_manager1,  # First record manager is author
            assignee=reviewer,
        )
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list,
            user=record_manager1,
            role=ListRole.author,
        )
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list,
            user=reviewer,
            role=ListRole.main_reviewer,
        )

        # Second record manager tries to assign first record manager as reviewer
        self.client.force_login(record_manager2)
        endpoint = reverse(
            "api:destructionlist-reassign", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={"assignee": {"user": record_manager1.pk}, "comment": "Tralala"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["assignee"]["user"][0],
            _("The author of a list cannot also be a reviewer."),
        )

    def test_queue_destruction_for_failed_list(self):
        user = UserFactory.create(post__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            name="A deleted list",
            status=ListStatus.deleted,
            processing_status=InternalStatus.failed,
            planned_destruction_date=date(2025, 3, 23),
        )

        self.client.force_authenticate(user=user)
        with (
            freeze_time("2025-03-24"),
            patch(
                "openarchiefbeheer.destruction.api.viewsets.delete_destruction_list"
            ) as m,
        ):
            response = self.client.post(
                reverse(
                    "api:destructionlist-queue-destruction",
                    kwargs={"uuid": destruction_list.uuid},
                ),
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        m.assert_called_once_with(destruction_list)

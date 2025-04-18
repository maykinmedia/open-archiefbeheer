from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.tests.factories import DestructionListFactory


class LogsViewsetTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:logs-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        destruction_list1 = DestructionListFactory.create()
        destruction_list2 = DestructionListFactory.create()

        TimelineLog.objects.create(
            content_object=destruction_list1,
            template="logging/destruction_list_created.txt",
            extra_data={},
            user=record_manager,
        )
        TimelineLog.objects.create(
            content_object=destruction_list1,
            template="logging/destruction_list_ready_for_first_review.txt",
            extra_data={},
            user=record_manager,
        )
        TimelineLog.objects.create(
            content_object=destruction_list2,
            template="logging/destruction_list_created.txt",
            extra_data={},
            user=record_manager,
        )

        endpoint = furl(reverse("api:logs-list"))
        endpoint.args["destruction_list"] = destruction_list1.uuid
        endpoint.args["event"] = "destruction_list_created"

        self.client.force_login(record_manager)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)

    def test_order(self):
        record_manager = UserFactory.create(post__can_start_destruction=True)
        destruction_list = DestructionListFactory.create()
        today = datetime.now().replace(tzinfo=ZoneInfo("Europe/Amsterdam"))

        log_today = TimelineLog.objects.create(
            content_object=destruction_list,
            template="logging/destruction_list_created.txt",
            extra_data={},
            user=record_manager,
        )
        log_today.timestamp = today
        log_today.save()

        log_two_days_ago = TimelineLog.objects.create(
            content_object=destruction_list,
            template="logging/destruction_list_created.txt",
            extra_data={},
            user=record_manager,
        )
        log_two_days_ago.timestamp = today - timedelta(days=2)
        log_two_days_ago.save()

        log_yesterday = TimelineLog.objects.create(
            content_object=destruction_list,
            template="logging/destruction_list_created.txt",
            extra_data={},
            user=record_manager,
        )
        log_yesterday.timestamp = today - timedelta(days=1)
        log_yesterday.save()

        endpoint = furl(reverse("api:logs-list"))
        endpoint.args["destruction_list"] = destruction_list.uuid

        self.client.force_login(record_manager)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 3)
        self.assertEqual(data[0]["pk"], log_two_days_ago.pk)
        self.assertEqual(data[1]["pk"], log_yesterday.pk)
        self.assertEqual(data[2]["pk"], log_today.pk)

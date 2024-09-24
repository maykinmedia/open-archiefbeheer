from unittest.mock import patch

from django.core import mail
from django.utils.translation import gettext_lazy as _

import freezegun
from furl import furl
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ..constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
    ReviewDecisionChoices,
)
from ..models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListItemReview,
    DestructionListReview,
    ReviewItemResponse,
    ReviewResponse,
)
from .factories import (
    DestructionListAssigneeFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    DestructionListItemReviewFactory,
    DestructionListReviewFactory,
    ReviewItemResponseFactory,
    ReviewResponseFactory,
)


class DestructionListViewSetTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:destructionlist-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_permission(self):
        user = UserFactory.create(role__can_start_destruction=False)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:destructionlist-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_destruction_list(self):
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        reviewer = UserFactory.create(
            username="reviewer", role__can_review_destruction=True
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            omschrijving="Description 1",
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
            omschrijving="Description 2",
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse("api:destructionlist-list")

        response = self.client.post(
            endpoint,
            data={
                "name": "A test list",
                "contains_sensitive_info": True,
                "reviewer": {"user": reviewer.pk},
                "items": [
                    {
                        "zaak": "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                        "extra_zaak_data": {},
                    },
                    {
                        "zaak": "http://localhost:8003/zaken/api/v1/zaken/222-222-222",
                        "extra_zaak_data": {},
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        destruction_list = DestructionList.objects.get(name="A test list")

        assignees = destruction_list.assignees.order_by("pk")

        self.assertEqual(assignees.count(), 2)
        self.assertEqual(assignees[0].user.username, "record_manager")
        self.assertEqual(assignees[0].role, ListRole.author)
        self.assertEqual(assignees[1].user.username, "reviewer")
        self.assertEqual(assignees[1].role, ListRole.reviewer)

        items = destruction_list.items.order_by("zaak__url")

        self.assertEqual(items.count(), 2)
        self.assertEqual(
            items[0].zaak.url, "http://localhost:8003/zaken/api/v1/zaken/111-111-111"
        )
        self.assertEqual(
            items[1].zaak.url, "http://localhost:8003/zaken/api/v1/zaken/222-222-222"
        )
        self.assertEqual(
            items[0]._zaak_url, "http://localhost:8003/zaken/api/v1/zaken/111-111-111"
        )
        self.assertEqual(
            items[1]._zaak_url, "http://localhost:8003/zaken/api/v1/zaken/222-222-222"
        )

        self.assertEqual(destruction_list.author, record_manager)

    def test_list_destruction_lists(self):
        user = UserFactory.create()
        DestructionListFactory.create_batch(3)

        self.client.force_authenticate(user=user)
        endpoint = reverse("api:destructionlist-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 3)

    def test_zaak_already_in_another_destruction_list(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        reviewer = UserFactory.create(
            username="reviewer", role__can_review_destruction=True
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
            omschrijving="Description 2",
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse("api:destructionlist-list")

        response = self.client.post(
            endpoint,
            data={
                "name": "A test list",
                "contains_sensitive_info": True,
                "assignees": [
                    {"user": reviewer.pk},
                ],
                "items": [
                    {
                        "zaak": "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                        "extra_zaak_data": {},
                    },
                    {
                        "zaak": "http://localhost:8003/zaken/api/v1/zaken/222-222-222",
                        "extra_zaak_data": {},
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        data = response.json()

        self.assertEqual(
            data,
            {
                "items": [
                    {
                        "zaak": [
                            _(
                                "This case was already included in another destruction list and was"
                                " not exempt during the review process."
                            )
                        ]
                    },
                    {},
                ]
            },
        )

        self.assertFalse(DestructionList.objects.filter(name="A test list").exists())

    def test_update_destruction_list(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        reviewer = UserFactory.create(
            username="reviewer", role__can_review_destruction=True
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/111-111-111",
        )
        ZaakFactory.create(
            url="http://localhost:8003/zaken/api/v1/zaken/222-222-222",
        )

        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.new,
        )
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list, user=reviewer, role=ListRole.reviewer
        )
        DestructionListItemFactory.create_batch(
            2,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )

        data = {
            "name": "An updated test list",
            "contains_sensitive_info": False,
            "items": [
                {
                    "zaak": "http://localhost:8003/zaken/api/v1/zaken/111-111-111",
                    "extra_zaak_data": {"key": "value"},
                },
            ],
        }
        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
        )

        response = self.client.put(
            endpoint,
            data=data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.name, "An updated test list")
        self.assertEqual(destruction_list.items.all().count(), 1)

    def test_cannot_update_destruction_list_if_not_new(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.ready_to_review,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.put(
            endpoint,
            data={
                "name": "An updated test list",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_update_destruction_list_if_not_author(self):
        record_manager1 = UserFactory.create(role__can_start_destruction=True)
        record_manager2 = UserFactory.create(role__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager1,
            status=ListStatus.new,
        )

        self.client.force_authenticate(user=record_manager2)
        endpoint = reverse(
            "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.put(
            endpoint,
            data={
                "name": "An updated test list",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_reassign_destruction_list_if_not_record_manager(self):
        not_record_manager = UserFactory.create(role__can_start_destruction=False)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review,
        )
        DestructionListAssigneeFactory.create_batch(
            2, destruction_list=destruction_list
        )
        other_reviewers = UserFactory.create_batch(2, role__can_review_destruction=True)

        self.client.force_authenticate(user=not_record_manager)
        endpoint = reverse(
            "api:destructionlist-reassign", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={
                "assignee": {"user": other_reviewers[0].pk},
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_reassign_destruction_list_without_comment(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        reviewer = UserFactory.create(role__can_review_destruction=True)
        destruction_list = DestructionListFactory.create(
            author=record_manager,
            status=ListStatus.new,
        )
        DestructionListAssigneeFactory.create(
            user=reviewer, destruction_list=destruction_list
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-reassign", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={
                "assignees": [
                    {"user": reviewer.pk},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["comment"][0], _("This field is required."))

    def test_cannot_reassign_destruction_list_with_empty_comment(self):
        record_manager1 = UserFactory.create(role__can_start_destruction=True)
        reviewer = DestructionListAssigneeFactory.create(
            user__role__can_review_destruction=True
        )

        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager1,
            status=ListStatus.new,
        )
        destruction_list.assignees.set([reviewer])

        self.client.force_authenticate(user=record_manager1)
        endpoint = reverse(
            "api:destructionlist-reassign", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={
                "assignees": {"user": reviewer.pk},
                "comment": " ",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["comment"][0], _("This field may not be blank.")
        )

    def test_cannot_reassign_destruction_list_with_author_as_reviewer(self):
        record_manager = UserFactory.create(
            role__can_start_destruction=True, role__can_review_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.new,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-reassign", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={
                "assignee": {
                    "user": record_manager.pk,
                },
                "comment": "comment",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["assignee"]["user"][0],
            _("The author of a list cannot also be a reviewer."),
        )

    def test_reassign_destruction_list(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            status=ListStatus.ready_to_review, author=record_manager
        )
        DestructionListAssigneeFactory.create(destruction_list=destruction_list)
        other_reviewer = UserFactory.create(role__can_review_destruction=True)

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-reassign", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={
                "assignee": {"user": other_reviewer.pk},
                "comment": "Lorem ipsum...",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        new_assignees = DestructionListAssignee.objects.filter(
            destruction_list=destruction_list, role=ListRole.reviewer
        ).order_by("pk")

        self.assertEqual(new_assignees[0].user, other_reviewer)

        log_entry = TimelineLog.objects.filter(
            template__icontains="destruction_list_reassigned"
        )[0]

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            log_entry.extra_data["assignee"]["user"]["pk"], other_reviewer.pk
        )
        self.assertEqual(log_entry.extra_data["comment"], "Lorem ipsum...")

    def test_partially_update_destruction_list(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        reviewer = UserFactory.create(
            username="reviewer", role__can_review_destruction=True
        )

        destruction_list = DestructionListFactory.create(
            name="A test list", contains_sensitive_info=True
        )
        DestructionListAssigneeFactory.create(
            destruction_list=destruction_list, user=reviewer, role=ListRole.reviewer
        )
        DestructionListItemFactory.create_batch(
            2,
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )

        data = {
            "name": "An updated test list",
        }
        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-detail", kwargs={"uuid": destruction_list.uuid}
        )

        response = self.client.patch(
            endpoint,
            data=data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.name, "An updated test list")
        self.assertEqual(destruction_list.items.all().count(), 2)
        self.assertEqual(destruction_list.assignees.all().count(), 1)

    def test_destruction_list_filter_on_assignee(self):
        user = UserFactory.create()
        reviewer1 = UserFactory.create()
        reviewer2 = UserFactory.create()
        lists = DestructionListFactory.create_batch(3)
        lists[0].assignee = reviewer1
        lists[1].save()
        lists[1].assignee = reviewer2
        lists[1].save()
        lists[2].assignee = reviewer2
        lists[2].save()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:destructionlist-list"))
        endpoint.args["assignee"] = reviewer2.pk

        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)
        self.assertEqual(
            [destruction_list["uuid"] for destruction_list in response.json()].sort(),
            [lists[0].uuid, lists[1].uuid].sort(),
        )

    def test_mark_as_final(self):
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        archivist = UserFactory.create(
            username="archivist", role__can_review_final_list=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            author=record_manager,
            status=ListStatus.internally_reviewed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-make-final", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={
                "user": archivist.pk,
                "comment": "The list is ready for the archivist",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        assignee_archivist = DestructionListAssignee.objects.get(
            destruction_list=destruction_list, role=ListRole.archivist
        )
        destruction_list.refresh_from_db()

        self.assertEqual(assignee_archivist.user, destruction_list.assignee)
        self.assertEqual(destruction_list.status, ListStatus.ready_for_archivist)

        logs = TimelineLog.objects.filter(
            template="logging/destruction_list_finalized.txt"
        )

        self.assertEqual(logs.count(), 1)

        message = logs[0].get_message()

        self.assertEqual(
            message.strip("\n"),
            _(
                'Destruction list "%(list_name)s" was made final by the record manager '
                "%(record_manager)s who assigned it to the archivist %(archivist)s."
            )
            % {
                "list_name": "A test list",
                "record_manager": "record_manager",
                "archivist": "archivist",
            },
        )
        self.assertEqual(
            logs[0].extra_data["comment"], "The list is ready for the archivist"
        )

    def test_cannot_mark_as_final_if_not_authenticated(self):
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            status=ListStatus.internally_reviewed,
        )

        response = self.client.post(
            reverse(
                "api:destructionlist-make-final", kwargs={"uuid": destruction_list.uuid}
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_mark_as_final_if_not_author(self):
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        archivist = UserFactory.create(
            username="archivist", role__can_review_final_list=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            contains_sensitive_info=True,
            status=ListStatus.internally_reviewed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-make-final", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={"user": archivist.pk},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_mark_as_finally_if_not_internally_reviewed(self):
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        archivist = UserFactory.create(
            username="archivist", role__can_review_final_list=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            contains_sensitive_info=True,
            status=ListStatus.changes_requested,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-make-final", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={"user": archivist.pk},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_mark_as_final_if_posted_user_is_not_archivist(self):
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        internal_reviewer = UserFactory.create(
            username="archivist", role__can_review_final_list=False
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            contains_sensitive_info=True,
            status=ListStatus.internally_reviewed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse(
            "api:destructionlist-make-final", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint,
            data={"user": internal_reviewer.pk},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["user"][0],
            _("The chosen user does not have the permission to review a final list."),
        )

    def test_mark_as_ready_to_review(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)

        destruction_list = DestructionListFactory.create(
            name="A test list",
            author=record_manager,
            status=ListStatus.new,
        )
        DestructionListAssigneeFactory.create(
            user=record_manager, destruction_list=destruction_list, role=ListRole.author
        )
        reviewer = DestructionListAssigneeFactory.create(
            destruction_list=destruction_list,
            role=ListRole.reviewer,
            user__role__can_review_destruction=True,
        )

        self.client.force_authenticate(user=record_manager)
        with (
            patch(
                "openarchiefbeheer.destruction.utils.EmailConfig.get_solo",
                return_value=EmailConfig(
                    subject_review_required="Destruction list review request",
                    body_review_required="Please review the list",
                ),
            ),
        ):
            response = self.client.post(
                reverse(
                    "api:destructionlist-mark-ready-review",
                    kwargs={"uuid": destruction_list.uuid},
                ),
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.assignee, reviewer.user)

        sent_mail = mail.outbox

        self.assertEqual(len(sent_mail), 1)
        self.assertEqual(sent_mail[0].subject, "Destruction list review request")
        self.assertEqual(sent_mail[0].recipients(), [reviewer.user.email])

    def test_cannot_mark_as_ready_to_review_if_not_authenticated(self):
        destruction_list = DestructionListFactory.create(
            name="A test list",
            status=ListStatus.new,
        )

        response = self.client.post(
            reverse(
                "api:destructionlist-mark-ready-review",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_mark_as_ready_to_review_if_not_author(self):
        record_manager = UserFactory.create(
            username="record_manager", role__can_start_destruction=True
        )
        destruction_list = DestructionListFactory.create(
            name="A test list",
            status=ListStatus.new,
        )

        self.client.force_authenticate(user=record_manager)
        response = self.client.post(
            reverse(
                "api:destructionlist-mark-ready-review",
                kwargs={"uuid": destruction_list.uuid},
            ),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DestructionListItemsViewSetTest(APITestCase):
    def test_not_authenticated(self):
        endpoint = reverse("api:destruction-list-items-list")

        response = self.client.post(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_destruction_list_items(self):
        record_manager = UserFactory.create(username="record_manager")

        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/333-333-333",
            status=ListItemStatus.removed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = reverse("api:destruction-list-items-list")

        response = self.client.get(
            endpoint,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = sorted(response.json()["results"], key=lambda item: item["zaak"]["url"])

        self.assertEqual(
            data[0]["zaak"]["url"],
            "http://zaken.nl/api/v1/zaken/111-111-111",
        )
        self.assertEqual(
            data[1]["zaak"]["url"],
            "http://zaken.nl/api/v1/zaken/222-222-222",
        )
        self.assertEqual(
            data[2]["zaak"]["url"],
            "http://zaken.nl/api/v1/zaken/333-333-333",
        )

    def test_filter_items_on_destruction_list(self):
        record_manager = UserFactory.create(username="record_manager")

        destruction_list = DestructionListFactory.create()
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/333-333-333",
            destruction_list=destruction_list,
            status=ListItemStatus.removed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["item-destruction_list"] = str(destruction_list.uuid)

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["count"], 2)

    def test_filter_items_on_destruction_list_and_status(self):
        record_manager = UserFactory.create(username="record_manager")

        destruction_list = DestructionListFactory.create()
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/111-111-111",
            destruction_list=destruction_list,
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/222-222-222",
            status=ListItemStatus.suggested,
        )
        DestructionListItemFactory.create(
            with_zaak=True,
            zaak__url="http://zaken.nl/api/v1/zaken/333-333-333",
            destruction_list=destruction_list,
            status=ListItemStatus.removed,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["item-destruction_list"] = str(destruction_list.uuid)
        endpoint.args["item-status"] = ListItemStatus.suggested

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["count"], 1)

    def test_order_on_processing_status(self):
        record_manager = UserFactory.create(username="record_manager")
        destruction_list = DestructionListFactory.create()
        item1 = DestructionListItemFactory.create(
            status=ListItemStatus.suggested,
            destruction_list=destruction_list,
            processing_status=InternalStatus.succeeded,
            with_zaak=True,
        )
        item2 = DestructionListItemFactory.create(
            status=ListItemStatus.suggested,
            destruction_list=destruction_list,
            processing_status=InternalStatus.processing,
            with_zaak=True,
        )
        item3 = DestructionListItemFactory.create(
            status=ListItemStatus.suggested,
            destruction_list=destruction_list,
            processing_status=InternalStatus.failed,
            with_zaak=True,
        )

        self.client.force_authenticate(user=record_manager)
        endpoint = furl(reverse("api:destruction-list-items-list"))
        endpoint.args["item-destruction_list"] = str(destruction_list.uuid)

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(data["results"][0]["pk"], item3.pk)
        self.assertEqual(data["results"][1]["pk"], item2.pk)
        self.assertEqual(data["results"][2]["pk"], item1.pk)


class DestructionListReviewViewSetTest(APITestCase):
    def test_no_auth(self):
        endpoint = reverse("api:destruction-list-reviews-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_on_destruction_list(self):
        reviews = DestructionListReviewFactory.create_batch(3)
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:destruction-list-reviews-list"))
        endpoint.args["destruction_list__uuid"] = str(reviews[0].destruction_list.uuid)

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)

    def test_create_review(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )
        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            user=reviewer,
            role=ListRole.reviewer,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        self.client.force_authenticate(user=reviewer)
        response = self.client.post(
            reverse("api:destruction-list-reviews-list"), data=data
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            DestructionListReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            1,
        )

    def test_create_review_rejected(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )
        items = DestructionListItemFactory.create_batch(
            3, destruction_list=destruction_list, with_zaak=True
        )
        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.rejected,
            "list_feedback": "I disagree with this list",
            "zaken_reviews": [
                {
                    "zaak_url": items[0].zaak.url,
                    "feedback": "This item should not be deleted.",
                },
                {
                    "zaak_url": items[1].zaak.url,
                    "feedback": "We should wait to delete this.",
                },
            ],
        }
        self.client.force_authenticate(user=reviewer)
        response = self.client.post(
            reverse("api:destruction-list-reviews-list"), data=data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            DestructionListReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            1,
        )
        self.assertEqual(
            DestructionListItemReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            2,
        )

    def test_create_review_archivist_accepted(self):
        archivist = UserFactory.create(
            username="archivaris",
            email="archivaris@oab.nl",
            role__can_review_final_list=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=archivist, status=ListStatus.ready_for_archivist
        )
        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            user=archivist,
            role=ListRole.archivist,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
        }
        self.client.force_authenticate(user=archivist)
        response = self.client.post(
            reverse("api:destruction-list-reviews-list"), data=data
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            DestructionListReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            1,
        )

    def test_create_review_archivist_rejected(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_final_list=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_for_archivist
        )
        items = DestructionListItemFactory.create_batch(
            3, destruction_list=destruction_list, with_zaak=True
        )
        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.rejected,
            "list_feedback": "I disagree with this list",
            "zaken_reviews": [
                {
                    "zaak_url": items[0].zaak.url,
                    "feedback": "This item should not be deleted.",
                },
                {
                    "zaak_url": items[1].zaak.url,
                    "feedback": "We should wait to delete this.",
                },
            ],
        }
        self.client.force_authenticate(user=reviewer)
        response = self.client.post(
            reverse("api:destruction-list-reviews-list"), data=data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            DestructionListReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            1,
        )
        self.assertEqual(
            DestructionListItemReview.objects.filter(
                destruction_list=destruction_list
            ).count(),
            2,
        )

    def test_list_with_ordering(self):
        reviews = DestructionListReviewFactory.create_batch(3)
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:destruction-list-reviews-list"))
        endpoint.args["ordering"] = "-created"

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(reviews[-1].pk, data[0]["pk"])
        self.assertEqual(reviews[-2].pk, data[1]["pk"])
        self.assertEqual(reviews[-3].pk, data[2]["pk"])

    def test_filter_on_decision(self):
        DestructionListReviewFactory.create_batch(
            3, decision=ReviewDecisionChoices.accepted
        )
        reviews_rejected = DestructionListReviewFactory.create_batch(
            2, decision=ReviewDecisionChoices.rejected
        )
        user = UserFactory.create()

        self.client.force_authenticate(user=user)
        endpoint = furl(reverse("api:destruction-list-reviews-list"))
        endpoint.args["decision"] = ReviewDecisionChoices.rejected

        response = self.client.get(
            endpoint.url,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        expected_pks = [review.pk for review in reviews_rejected]
        self.assertIn(data[0]["pk"], expected_pks)
        self.assertIn(data[1]["pk"], expected_pks)
        self.assertEqual(len(data), 2)

    def test_create_review_accepted_long_procedure(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )

        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/1",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/1",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/2",
        )
        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            user=reviewer,
            role=ListRole.reviewer,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
            "list_feedback": "I accept with this list",
        }
        self.client.force_authenticate(user=reviewer)

        with patch(
            "openarchiefbeheer.destruction.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(
                zaaktypes_short_process=["http://catalogi-api.nl/zaaktype/1"]
            ),
        ):
            response = self.client.post(
                reverse("api:destruction-list-reviews-list"), data=data, format="json"
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.internally_reviewed)

    def test_create_review_accepted_short_procedure(self):
        reviewer = UserFactory.create(
            username="reviewer",
            email="reviewer@oab.nl",
            role__can_review_destruction=True,
        )
        destruction_list = DestructionListFactory.create(
            assignee=reviewer, status=ListStatus.ready_to_review
        )

        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/1",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/1",
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktype/2",
        )

        DestructionListAssigneeFactory.create(
            user=destruction_list.author,
            role=ListRole.author,
            destruction_list=destruction_list,
        )
        DestructionListAssigneeFactory.create(
            user=reviewer,
            role=ListRole.reviewer,
            destruction_list=destruction_list,
        )

        data = {
            "destruction_list": destruction_list.uuid,
            "decision": ReviewDecisionChoices.accepted,
            "list_feedback": "I accept with this list",
        }
        self.client.force_authenticate(user=reviewer)

        with patch(
            "openarchiefbeheer.destruction.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(
                zaaktypes_short_process=[
                    "http://catalogi-api.nl/zaaktype/1",
                    "http://catalogi-api.nl/zaaktype/2",
                ]
            ),
        ):
            response = self.client.post(
                reverse("api:destruction-list-reviews-list"), data=data, format="json"
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        destruction_list.refresh_from_db()

        self.assertEqual(destruction_list.status, ListStatus.ready_to_delete)


class DestructionListItemReviewViewSetTests(APITestCase):
    def test_no_auth(self):
        endpoint = reverse("api:reviews-items-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_on_review(self):
        user = UserFactory.create()

        reviews = DestructionListReviewFactory.create_batch(2)
        DestructionListItemReviewFactory.create_batch(3, review=reviews[0])
        item_reviews = DestructionListItemReviewFactory.create_batch(
            2, review=reviews[1], destruction_list_item__with_zaak=True
        )

        endpoint = furl(reverse("api:reviews-items-list"))
        endpoint.args["item-review-review"] = reviews[1].pk

        self.client.force_authenticate(user=user)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 2)
        expected_pks = [item_review.pk for item_review in item_reviews]
        self.assertIn(data[0]["pk"], expected_pks)
        self.assertIn(data[1]["pk"], expected_pks)

    def test_with_deleted_zaken(self):
        user = UserFactory.create()

        item_review = DestructionListItemReviewFactory.create(
            destruction_list_item__with_zaak=True
        )

        item_review.destruction_list_item.zaak.delete()

        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("api:reviews-items-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertIsNone(data[0]["zaak"])


class ReviewResponsesViewSetTests(APITestCase):
    def test_no_auth(self):
        endpoint = reverse("api:review-responses-list")

        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_on_review(self):
        user = UserFactory.create()

        review = DestructionListReviewFactory.create(destruction_list__name="List 1")
        review_response = ReviewResponseFactory.create(review=review)
        ReviewItemResponseFactory.create_batch(2, review_item__review=review)
        another_response = ReviewResponseFactory.create()
        ReviewItemResponseFactory.create(review_item__review=another_response.review)

        endpoint = furl(reverse("api:review-responses-list"))
        endpoint.args["review"] = review.pk

        self.client.force_authenticate(user=user)
        response = self.client.get(endpoint.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["pk"], review_response.pk)
        self.assertEqual(len(data[0]["itemsResponses"]), 2)

    def test_create_review_response(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)
        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager,
        )
        items_reviews = DestructionListItemReviewFactory.create_batch(
            3,
            destruction_list_item__destruction_list=review.destruction_list,
            review=review,
        )

        endpoint = reverse("api:review-responses-list")
        self.client.force_authenticate(user=record_manager)

        response = self.client.post(
            endpoint,
            data={
                "review": review.pk,
                "comment": "A comment about the review.",
                "itemsResponses": [
                    {
                        "reviewItem": items_reviews[0].pk,
                        "actionItem": DestructionListItemAction.keep,
                        "comment": "This zaak needs to stay in the list.",
                    },
                    {
                        "reviewItem": items_reviews[1].pk,
                        "actionItem": DestructionListItemAction.remove,
                        "actionZaak": {"selectielijstklasse": "http://some-url.nl"},
                        "comment": "Changed the selectielijstklasse and removed from the list.",
                    },
                    {
                        "reviewItem": items_reviews[2].pk,
                        "actionItem": DestructionListItemAction.remove,
                        "actionZaak": {"archiefactiedatum": "2030-01-01"},
                        "comment": "Changed the archiefactiedatum and removed from the list.",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReviewResponse.objects.filter(review=review).count(), 1)
        self.assertEqual(
            ReviewItemResponse.objects.filter(review_item__review=review).count(), 3
        )

        item_response1 = ReviewItemResponse.objects.get(review_item=items_reviews[0].pk)

        self.assertEqual(item_response1.action_item, DestructionListItemAction.keep)
        self.assertEqual(item_response1.comment, "This zaak needs to stay in the list.")

        item_response2 = ReviewItemResponse.objects.get(review_item=items_reviews[1].pk)

        self.assertEqual(
            item_response2.action_zaak["selectielijstklasse"], "http://some-url.nl"
        )

        item_response3 = ReviewItemResponse.objects.get(review_item=items_reviews[2].pk)

        self.assertEqual(item_response3.action_zaak["archiefactiedatum"], "2030-01-01")

    def test_cannot_create_response_if_not_author(self):
        record_manager1 = UserFactory.create(role__can_start_destruction=True)
        record_manager2 = UserFactory.create(role__can_start_destruction=True)

        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager1,
            destruction_list__status=ListStatus.changes_requested,
            destruction_list__assignee=record_manager1,
        )

        endpoint = reverse("api:review-responses-list")
        self.client.force_authenticate(user=record_manager2)

        response = self.client.post(
            endpoint,
            data={
                "review": review.pk,
                "comment": "A comment about the review.",
                "itemsResponses": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["nonFieldErrors"][0],
            _(
                "This user is either not allowed to update the destruction list or "
                "the destruction list cannot currently be updated."
            ),
        )

    def test_cannot_create_response_if_not_changes_requested(self):
        record_manager = UserFactory.create(role__can_start_destruction=True)

        review = DestructionListReviewFactory.create(
            destruction_list__author=record_manager,
            destruction_list__status=ListStatus.ready_to_review,
            destruction_list__assignee=record_manager,
        )

        endpoint = reverse("api:review-responses-list")
        self.client.force_authenticate(user=record_manager)

        response = self.client.post(
            endpoint,
            data={
                "review": review.pk,
                "comment": "A comment about the review.",
                "itemsResponses": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["nonFieldErrors"][0],
            _(
                "This user is either not allowed to update the destruction list or "
                "the destruction list cannot currently be updated."
            ),
        )

    @freezegun.freeze_time("2023-09-15T21:36:00+02:00")
    def test_audit_log(self):
        # Reassign
        record_manager = UserFactory.create(role__can_start_destruction=True)
        destruction_list = DestructionListFactory.create(
            name="Test audittrail",
            status=ListStatus.ready_to_review,
            author=record_manager,
        )
        DestructionListAssigneeFactory.create(destruction_list=destruction_list)
        other_reviewer = UserFactory.create(role__can_review_destruction=True)

        self.client.force_authenticate(user=record_manager)
        endpoint_reassign = reverse(
            "api:destructionlist-reassign", kwargs={"uuid": destruction_list.uuid}
        )
        response = self.client.post(
            endpoint_reassign,
            data={
                "assignee": {"user": other_reviewer.pk},
                "comment": "Lorem ipsum...",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        endpoint_audittrail = reverse(
            "api:destructionlist-auditlog", kwargs={"uuid": destruction_list.uuid}
        )
        response_audittrail = self.client.get(endpoint_audittrail)

        self.assertEqual(response_audittrail.status_code, status.HTTP_200_OK)

        data = response_audittrail.data

        self.assertEqual(data[0]["user"]["pk"], record_manager.pk)
        self.assertEqual(
            data[0]["timestamp"],
            "2023-09-15T21:36:00+02:00",
        )
        self.assertEqual(
            data[0]["message"],
            _('Destruction list "%(list_name)s" was reassigned.')
            % {"list_name": "Test audittrail"},
        )
        self.assertEqual(
            data[0]["extra_data"]["assignee"]["user"],
            {
                "email": other_reviewer.email,
                "pk": other_reviewer.pk,
                "username": other_reviewer.username,
            },
        )

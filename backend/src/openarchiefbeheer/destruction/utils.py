from typing import Protocol

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.models import OuterRef, Q, QuerySet, Subquery

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.clients import (
    _cached_with_args,
    ztc_client,
)
from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.emails.render_backend import get_sandboxed_backend
from openarchiefbeheer.logging import logevent
from openarchiefbeheer.selection.models import SelectionItem
from openarchiefbeheer.zaken.models import Zaak

from .constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListStatus,
)
from .models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListItem,
    ReviewItemResponse,
)


def notify(
    subject: str, body_html: str, body_text: str, context: dict, recipients: list[str]
) -> None:
    if body_text == "" or body_html == "" or subject == "" or len(recipients) == 0:
        return

    backend = get_sandboxed_backend()

    template_html = backend.from_string(body_html)
    template_text = backend.from_string(body_text)
    html_content = template_html.render(context=context)
    text_content = template_text.render(context=context)

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipients,
    )
    message.attach_alternative(html_content, "text/html")
    message.send()


def notify_reviewer(
    user: User,
    destruction_list: DestructionList,
) -> None:
    config = EmailConfig.get_solo()

    notify(
        subject=config.subject_review_required,
        body_text=config.body_review_required_text,
        body_html=config.body_review_required_html,
        context={"user_name": user.get_full_name(), "list_name": destruction_list.name},
        recipients=[user.email],
    )


def notify_author_positive_review(
    user: User,
    destruction_list: DestructionList,
) -> None:
    config = EmailConfig.get_solo()

    last_reviewer = destruction_list.reviews.all().order_by("created").last().author

    notify(
        subject=config.subject_positive_review,
        body_text=config.body_positive_review_text,
        body_html=config.body_positive_review_html,
        context={
            "user_name": user.get_full_name(),
            "list_name": destruction_list.name,
            "reviewer": last_reviewer,
            "current_reviewer": destruction_list.assignee,
        },
        recipients=[user.email],
    )


def notify_author_changes_requested(
    user: User,
    destruction_list: DestructionList,
) -> None:
    config = EmailConfig.get_solo()

    notify(
        subject=config.subject_changes_requested,
        body_text=config.body_changes_requested_text,
        body_html=config.body_changes_requested_html,
        context={"user_name": user.get_full_name(), "list_name": destruction_list.name},
        recipients=[user.email],
    )


def notify_assignees_successful_deletion(destruction_list: DestructionList) -> None:
    config = EmailConfig.get_solo()
    recipients = destruction_list.assignees.all().values_list("user__email", flat=True)

    notify(
        subject=config.subject_successful_deletion,
        body_text=config.body_successful_deletion_text,
        body_html=config.body_successful_deletion_html,
        context={
            "list_name": destruction_list.name,
        },
        recipients=list(recipients),
    )


class ObjectWithStatus(Protocol):
    def set_processing_status(self, status: InternalStatus) -> None: ...


def replace_assignee(
    destruction_list: DestructionList,
    new_user: User,
) -> DestructionListAssignee:
    with transaction.atomic():
        current_assignee = destruction_list.assignees.get(
            user=destruction_list.assignee
        )
        current_role = current_assignee.role

        current_assignee.delete()
        new_assignee = DestructionListAssignee.objects.create(
            user=new_user,
            destruction_list=destruction_list,
            role=current_role,
        )

    return new_assignee


def resync_items_and_zaken() -> None:
    # Using the _zaak_url field, link the item to the zaak again
    DestructionListItem.objects.filter(~Q(_zaak_url=""), zaak__isnull=True).update(
        zaak_id=Subquery(
            Zaak.objects.filter(url=OuterRef("_zaak_url")).values("pk")[:1]
        )
    )

    # If the cases could not be linked again, the zaak does not exist anymore.
    # We need to delete them and log the deletion from the destruction list
    orphan_items = DestructionListItem.objects.filter(
        ~Q(_zaak_url=""), zaak__isnull=True
    )
    destruction_lists = DestructionList.objects.filter(
        pk__in=orphan_items.distinct("destruction_list").values_list(
            "destruction_list", flat=True
        )
    )
    for destruction_list in destruction_lists:
        items_in_list = orphan_items.filter(destruction_list=destruction_list)

        number_deleted_items, _ = items_in_list.delete()

        logevent.destruction_list_items_deleted(destruction_list, number_deleted_items)


@_cached_with_args
def get_selectielijstklasse(resultaattype_url: str) -> str:
    with ztc_client() as client:
        response = client.get(resultaattype_url)
        response.raise_for_status()
        resultaattype = response.json()

    return resultaattype["selectielijstklasse"]


def get_selection_key_for_review(
    destruction_list: "DestructionList", context: str
) -> str:
    """
    Warning! This key needs to remain in sync with the key created by the frontend,
    since the frontend need to be able to retrieve the pre-populates selection
    in the review page. See github issue #498
    """
    return f"destruction-list-{context}-{destruction_list.uuid}-{ListStatus.ready_to_review}"


def prepopulate_selection_after_review_response(
    destruction_list: "DestructionList",
    review_response_items: QuerySet[ReviewItemResponse],
) -> None:
    selection_key = get_selection_key_for_review(destruction_list, "review")

    ignored_advice_responses = review_response_items.filter(
        action_item=DestructionListItemAction.keep
    )

    selection_items_advice_ignored_to_create = [
        SelectionItem(
            key=selection_key,
            selection_data={"selected": False},
            zaak_url=response.review_item.destruction_list_item.zaak.url,
        )
        for response in ignored_advice_responses
    ]

    # Make sure that the selection is clean
    SelectionItem.objects.filter(key=selection_key).delete()

    # Create the selection items for the items where review advice
    # was ignored (they will appear NOT selected)
    SelectionItem.objects.bulk_create(selection_items_advice_ignored_to_create)

    # Create the selection items for the items that were already
    # approved (they will appear as selected and approved)
    other_selection_items_to_create = [
        SelectionItem(
            key=selection_key,
            selection_data={"selected": True, "detail": {"approved": True}},
            zaak_url=item.zaak.url,
        )
        for item in destruction_list.items.filter(
            ~Q(
                zaak__in=ignored_advice_responses.values_list(
                    "review_item__destruction_list_item__zaak"
                )
            ),
            status=ListItemStatus.suggested,
        )
    ]

    SelectionItem.objects.bulk_create(other_selection_items_to_create)

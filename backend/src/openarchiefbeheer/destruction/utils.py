from base64 import b64encode
from typing import Protocol

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import OuterRef, Q, QuerySet, Subquery
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from zgw_consumers.client import build_client
from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from openarchiefbeheer.accounts.models import User
from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.emails.models import EmailConfig
from openarchiefbeheer.emails.render_backend import get_sandboxed_backend
from openarchiefbeheer.logging import logevent
from openarchiefbeheer.selection.models import SelectionItem
from openarchiefbeheer.utils.results_store import ResultStore
from openarchiefbeheer.zaken.models import Zaak

from .constants import (
    DestructionListItemAction,
    InternalStatus,
    ListItemStatus,
    ListRole,
    ListStatus,
)
from .models import (
    DestructionList,
    DestructionListAssignee,
    DestructionListItem,
    ReviewItemResponse,
)


def notify(subject: str, body: str, context: dict, recipients: list[str]) -> None:
    if body == "" or subject == "" or len(recipients) == 0:
        return

    backend = get_sandboxed_backend()

    template = backend.from_string(body)
    formatted_body = template.render(context=context)

    send_mail(
        subject=subject,
        message=formatted_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipients,
        fail_silently=False,
    )


def notify_reviewer(
    user: User,
    destruction_list: DestructionList,
) -> None:
    config = EmailConfig.get_solo()

    notify(
        subject=config.subject_review_required,
        body=config.body_review_required,
        context={"user": user, "list": destruction_list},
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
        body=config.body_positive_review,
        context={
            "user": user,
            "list": destruction_list,
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
        body=config.body_changes_requested,
        context={"user": user, "list": destruction_list},
        recipients=[user.email],
    )


def notify_assignees_successful_deletion(destruction_list: DestructionList) -> None:
    config = EmailConfig.get_solo()
    recipients = destruction_list.assignees.all().values_list("user__email", flat=True)

    notify(
        subject=config.subject_successful_deletion,
        body=config.body_successful_deletion,
        context={
            "list": destruction_list,
        },
        recipients=list(recipients),
    )


class ObjectWithStatus(Protocol):
    def set_processing_status(self, status: InternalStatus) -> None: ...


def process_new_reviewer(
    destruction_list: DestructionList,
    reviewer: User,
) -> DestructionListAssignee:
    with transaction.atomic():
        destruction_list.assignees.filter(role=ListRole.main_reviewer).delete()
        new_reviewer = DestructionListAssignee(
            user=reviewer,
            destruction_list=destruction_list,
            role=ListRole.main_reviewer,
        )
        new_reviewer.save()

    return new_reviewer


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


def create_zaak_for_report(
    destruction_list: DestructionList, store: ResultStore
) -> None:
    config = ArchiveConfig.get_solo()

    zrc_service = Service.objects.get(api_type=APITypes.zrc)
    zrc_client = build_client(zrc_service)

    with zrc_client:
        if not destruction_list.zaak_destruction_report_url:
            response = zrc_client.post(
                "zaken",
                headers={
                    "Accept-Crs": "EPSG:4326",
                    "Content-Crs": "EPSG:4326",
                },
                json={
                    "bronorganisatie": config.bronorganisatie,
                    "omschrijving": _("Destruction report of list: %(list_name)s")
                    % {"list_name": destruction_list.name},
                    "zaaktype": config.zaaktype,
                    "vertrouwelijkheidaanduiding": "openbaar",
                    "startdatum": timezone.now().date().isoformat(),
                    "verantwoordelijkeOrganisatie": config.bronorganisatie,
                    "archiefnominatie": "blijvend_bewaren",
                    "selectielijstklasse": config.selectielijstklasse,
                },
                timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            new_zaak = response.json()

            destruction_list.zaak_destruction_report_url = new_zaak["url"]
            destruction_list.save()

        if not store.has_created_resource("resultaten"):
            response = zrc_client.post(
                "resultaten",
                json={
                    "zaak": destruction_list.zaak_destruction_report_url,
                    "resultaattype": config.resultaattype,
                },
            )
            response.raise_for_status()
            store.add_created_resource("resultaten", response.json()["url"])

        if not store.has_created_resource("statussen"):
            response = zrc_client.post(
                "statussen",
                json={
                    "zaak": destruction_list.zaak_destruction_report_url,
                    "statustype": config.statustype,
                    "datum_status_gezet": timezone.now().date().isoformat(),
                },
            )
            response.raise_for_status()
            store.add_created_resource("statussen", response.json()["url"])


def create_eio_destruction_report(
    destruction_list: DestructionList, store: ResultStore
) -> None:
    if store.has_created_resource("enkelvoudiginformatieobjecten"):
        return

    config = ArchiveConfig.get_solo()

    drc_service = Service.objects.get(api_type=APITypes.drc)
    drc_client = build_client(drc_service)

    with drc_client, destruction_list.destruction_report.open("rb") as f_report:
        response = drc_client.post(
            "enkelvoudiginformatieobjecten",
            json={
                "bronorganisatie": config.bronorganisatie,
                "creatiedatum": timezone.now().date().isoformat(),
                "titel": _("Destruction report of list: %(list_name)s")
                % {"list_name": destruction_list.name},
                "auteur": "Open Archiefbeheer",
                "taal": "nld",
                "formaat": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "inhoud": b64encode(f_report.read()).decode("utf-8"),
                "informatieobjecttype": config.informatieobjecttype,
                "indicatie_gebruiksrecht": False,
            },
        )
        response.raise_for_status()
        new_document = response.json()

        store.add_created_resource("enkelvoudiginformatieobjecten", new_document["url"])


def attach_report_to_zaak(
    destruction_list: DestructionList, store: ResultStore
) -> None:
    if store.has_created_resource("zaakinformatieobjecten"):
        return

    zrc_service = Service.objects.get(api_type=APITypes.zrc)
    zrc_client = build_client(zrc_service)

    with zrc_client:
        response = zrc_client.post(
            "zaakinformatieobjecten",
            json={
                "zaak": destruction_list.zaak_destruction_report_url,
                "informatieobject": store.get_created_resources(
                    "enkelvoudiginformatieobjecten"
                )[0],
            },
        )
        response.raise_for_status()
        store.add_created_resource("zaakinformatieobjecten", response.json()["url"])


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

    selection_items_advice_ignored_to_create = []
    for response in ignored_advice_responses:
        selection_items_advice_ignored_to_create.append(
            SelectionItem(
                key=selection_key,
                selection_data={"selected": False},
                zaak_url=response.review_item.destruction_list_item.zaak.url,
            )
        )

    # Make sure that the selection is clean
    SelectionItem.objects.filter(key=selection_key).delete()

    # Create the selection items for the items where review advice
    # was ignored (they will appear NOT selected)
    SelectionItem.objects.bulk_create(selection_items_advice_ignored_to_create)

    # Create the selection items for the items that were already
    # approved (they will appear as selected and approved)
    other_selection_items_to_create = []
    for item in destruction_list.items.filter(
        ~Q(
            zaak__in=ignored_advice_responses.values_list(
                "review_item__destruction_list_item__zaak"
            )
        ),
        status=ListItemStatus.suggested,
    ):
        other_selection_items_to_create.append(
            SelectionItem(
                key=selection_key,
                selection_data={"selected": True, "detail": {"approved": True}},
                zaak_url=item.zaak.url,
            )
        )

    SelectionItem.objects.bulk_create(other_selection_items_to_create)

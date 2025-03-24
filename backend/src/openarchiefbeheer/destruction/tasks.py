import logging
from datetime import date

from django.conf import settings

from celery import chain

from openarchiefbeheer.celery import app
from openarchiefbeheer.logging import logevent

from .constants import InternalStatus, ListItemStatus, ListStatus
from .exceptions import DeletionProcessingError
from .models import DestructionList, DestructionListItem, ReviewResponse
from .signals import deletion_failure
from .utils import (
    notify_assignees_successful_deletion,
    prepopulate_selection_after_review_response,
)

logger = logging.getLogger(__name__)


@app.task
def process_review_response(pk: int) -> None:
    review_response = ReviewResponse.objects.select_related(
        "review", "review__destruction_list"
    ).get(pk=pk)
    items_review_responses = review_response.items_responses.select_related(
        "review_item",
        "review_item__destruction_list_item",
        "review_item__destruction_list_item__zaak",
    )

    for item_response in items_review_responses:
        try:
            item_response.process()
        except Exception as exc:
            logger.exception(
                "An error occurred while processing the review item response",
                exc_info=exc,
            )

            item_response.processing_status = InternalStatus.failed
            item_response.save()
            return

    destruction_list = review_response.review.destruction_list
    prepopulate_selection_after_review_response(
        destruction_list, items_review_responses
    )
    destruction_list.assign_next()

    logevent.destruction_list_review_response_processed(destruction_list)


def delete_destruction_list(destruction_list: DestructionList) -> None:
    if destruction_list.processing_status == InternalStatus.succeeded:
        logger.info(
            "Destruction list %s has already successfully been processed. Skipping.",
            destruction_list.pk,
        )
        return

    if not destruction_list.can_queue_destruction:
        logger.warning(
            "Cannot proceed with deleting list %s since it has status %s.",
            destruction_list.name,
            destruction_list.status,
        )
        return

    destruction_list.processing_status = InternalStatus.processing
    destruction_list.save()

    items_pks = [
        (item.pk,)
        for item in destruction_list.items.filter(status=ListItemStatus.suggested)
    ]

    chunk_tasks = delete_destruction_list_item.chunks(
        items_pks, settings.ZAKEN_CHUNK_SIZE
    )
    complete_and_notify_task = complete_and_notify.si(destruction_list.pk)

    task_chain = chain(
        chunk_tasks.group(),
        complete_and_notify_task,
        link_error=handle_processing_error.si(destruction_list.pk),
    )
    task_chain.delay()


@app.task
def queue_destruction_lists_for_deletion():
    today = date.today()
    destruction_lists_to_process = DestructionList.objects.filter(
        processing_status=InternalStatus.new,
        status=ListStatus.ready_to_delete,
        planned_destruction_date__lt=today,
    )

    for destruction_list in destruction_lists_to_process:
        delete_destruction_list(destruction_list)

        logger.info("Queued the destruction of list %s", str(destruction_list.pk))


@app.task
def handle_processing_error(pk: int) -> None:
    destruction_list = DestructionList.objects.get(pk=pk)
    destruction_list.processing_status = InternalStatus.failed
    destruction_list.save()

    deletion_failure.send(sender=destruction_list)

    logevent.destruction_list_deletion_failed(destruction_list)


@app.task
def delete_destruction_list_item(pk: int) -> None:
    item = DestructionListItem.objects.get(pk=pk)

    if item.processing_status == InternalStatus.succeeded:
        logger.info("Item %s already successfully processed. Skipping.", pk)
        return

    item.process_deletion()


@app.task
def complete_and_notify(pk: int) -> None:
    destruction_list = DestructionList.objects.get(pk=pk)
    if destruction_list.has_failures():
        raise DeletionProcessingError()

    destruction_list.set_status(ListStatus.deleted)

    destruction_list.generate_destruction_report()
    destruction_list.create_report_zaak()
    destruction_list.clear_local_metadata()

    destruction_list.processing_status = InternalStatus.succeeded
    destruction_list.save()

    notify_assignees_successful_deletion(destruction_list)

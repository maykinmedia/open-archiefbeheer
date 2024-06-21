import logging

from openarchiefbeheer.celery import app

from .constants import InternalStatus
from .models import ReviewResponse

logger = logging.getLogger(__name__)


@app.task
def process_review_response(pk: int) -> None:
    review_response = (
        ReviewResponse.objects.select_related("review").select_for_update().get(pk=pk)
    )
    if review_response.processing_status == InternalStatus.succeeded:
        return

    items_review_responses = review_response.items_responses.select_for_update()

    review_response.processing_status = InternalStatus.processing
    review_response.save()

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

            review_response.processing_status = InternalStatus.failed
            review_response.save()
            return

    review_response.processing_status = InternalStatus.succeeded
    review_response.save()

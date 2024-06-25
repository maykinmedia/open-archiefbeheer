import logging

from openarchiefbeheer.celery import app

from .constants import InternalStatus
from .models import ReviewResponse

logger = logging.getLogger(__name__)


@app.task
def process_review_response(pk: int) -> None:
    review_response = ReviewResponse.objects.select_related(
        "review", "review__destruction_list"
    ).get(pk=pk)
    items_review_responses = review_response.items_responses.select_related(
        "review_item", "review_item__destruction_list_item"
    ).select_for_update()

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

    review_response.review.destruction_list.assign_first_reviewer()

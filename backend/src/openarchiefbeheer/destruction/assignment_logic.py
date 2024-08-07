from typing import TYPE_CHECKING, Protocol

from django.db.models import Count, Min

from .constants import ListRole, ListStatus, ReviewDecisionChoices

if TYPE_CHECKING:
    from .models import DestructionList


class State(Protocol):
    def assign_next(self, destruction_list: "DestructionList") -> None: ...


class NewList:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        assignee = (
            destruction_list.assignees.filter(role=ListRole.reviewer)
            .order_by("pk")
            .first()
        )

        destruction_list.set_status(ListStatus.ready_to_review)
        destruction_list.assign(assignee)


class ReadyToReview:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        last_review = destruction_list.reviews.order_by("created").last()
        if last_review and last_review.decision == ReviewDecisionChoices.rejected:
            destruction_list.set_status(ListStatus.changes_requested)
            destruction_list.assign(destruction_list.get_author())
            return

        if destruction_list.all_reviewers_approved():
            new_status = (
                ListStatus.ready_to_delete
                if destruction_list.has_short_review_process()
                else ListStatus.internally_reviewed
            )
            destruction_list.set_status(new_status)
            destruction_list.assign(destruction_list.get_author())
            return

        # Find the reviewers who have given fewer reviews
        reviewers = destruction_list.assignees.filter(role=ListRole.reviewer).annotate(
            num_reviews=Count("user__created_reviews")
        )
        min_number_reviews = reviewers.aggregate(min_reviews=Min("num_reviews"))
        next_reviewer = (
            reviewers.filter(num_reviews=min_number_reviews["min_reviews"])
            .order_by("pk")
            .first()
        )
        destruction_list.assign(next_reviewer)


class ChangesRequested:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        destruction_list.set_status(ListStatus.ready_to_review)

        # The reviewer who rejected the list reviews first
        last_review = destruction_list.reviews.order_by("created").last()
        destruction_list.assign(destruction_list.get_assignee(last_review.author))


class InternallyReviewed:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        destruction_list.set_status(ListStatus.ready_for_archivist)

        archivist = (
            destruction_list.assignees.filter(role=ListRole.archivist)
            .order_by("pk")
            .first()
        )
        destruction_list.assign(archivist)


class ReadyForArchivist:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        last_review = destruction_list.reviews.order_by("created").last()
        if last_review and last_review.decision == ReviewDecisionChoices.accepted:
            destruction_list.set_status(ListStatus.ready_to_delete)
            destruction_list.assign(destruction_list.get_author())

        # TODO in the case where the archivist rejects it is not clear yet what should happen!


STATE_MANAGER = {
    ListStatus.new: NewList(),
    ListStatus.changes_requested: ChangesRequested(),
    ListStatus.ready_to_review: ReadyToReview(),
    ListStatus.internally_reviewed: InternallyReviewed(),
    ListStatus.ready_for_archivist: ReadyForArchivist(),
}

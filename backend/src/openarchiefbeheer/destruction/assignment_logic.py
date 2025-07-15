from typing import TYPE_CHECKING, Protocol

from .constants import ListRole, ListStatus, ReviewDecisionChoices
from .exceptions import NoReviewFoundError

if TYPE_CHECKING:
    from .models import DestructionList


class State(Protocol):
    def assign_next(self, destruction_list: "DestructionList") -> None: ...

    def reassign(self, destruction_list: "DestructionList") -> None: ...


class NewList:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        assignee = destruction_list.assignees.filter(
            role=ListRole.main_reviewer
        ).first()

        destruction_list.set_status(ListStatus.ready_to_review)
        destruction_list.assign(assignee)

    def reassign(self, destruction_list: "DestructionList") -> None:
        # When a list is new, the author is assigned as assignee, no action needed
        pass


class ReadyToReview:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        last_review = destruction_list.reviews.order_by("created").last()
        if last_review and last_review.decision == ReviewDecisionChoices.rejected:
            destruction_list.set_status(ListStatus.changes_requested)
            destruction_list.assign(destruction_list.get_author())
            return

        if last_review and last_review.decision == ReviewDecisionChoices.accepted:
            new_status = (
                ListStatus.ready_to_delete
                if destruction_list.has_short_review_process()
                else ListStatus.internally_reviewed
            )
            destruction_list.set_status(new_status)
            destruction_list.assign(destruction_list.get_author())
            return

        reviewer = destruction_list.assignees.filter(
            role=ListRole.main_reviewer
        ).first()
        destruction_list.assign(reviewer)

    def reassign(self, destruction_list: "DestructionList") -> None:
        reviewer = destruction_list.assignees.filter(
            role=ListRole.main_reviewer
        ).first()
        destruction_list.assign(reviewer)


class ChangesRequested:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        last_review = destruction_list.reviews.order_by("created").last()
        last_reviewer = destruction_list.get_assignee(last_review.author)

        if last_reviewer.role == ListRole.archivist:
            destruction_list.set_status(ListStatus.ready_for_archivist)
        else:
            destruction_list.set_status(ListStatus.ready_to_review)

        destruction_list.assign(last_reviewer)

    def reassign(self, destruction_list: "DestructionList") -> None:
        # When a list has requested changes, it is assigned to the author. No action needed.
        pass


class InternallyReviewed:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        destruction_list.set_status(ListStatus.ready_for_archivist)

        archivist = (
            destruction_list.assignees.filter(role=ListRole.archivist)
            .order_by("pk")
            .first()
        )
        destruction_list.assign(archivist)

    def reassign(self, destruction_list: "DestructionList") -> None:
        # When a list has been internally reviewed, it is assigned to the author. No action needed.
        pass


class ReadyForArchivist:
    def assign_next(self, destruction_list: "DestructionList") -> None:
        last_review = destruction_list.reviews.order_by("created").last()
        if not last_review:
            raise NoReviewFoundError()

        if last_review.decision == ReviewDecisionChoices.accepted:
            destruction_list.set_status(ListStatus.ready_to_delete)
        else:
            destruction_list.set_status(ListStatus.changes_requested)

        destruction_list.assign(destruction_list.get_author())

    def reassign(self, destruction_list: "DestructionList") -> None:
        archivist = destruction_list.assignees.filter(role=ListRole.archivist).first()
        destruction_list.assign(archivist)


STATE_MANAGER = {
    ListStatus.new: NewList(),
    ListStatus.changes_requested: ChangesRequested(),
    ListStatus.ready_to_review: ReadyToReview(),
    ListStatus.internally_reviewed: InternallyReviewed(),
    ListStatus.ready_for_archivist: ReadyForArchivist(),
}

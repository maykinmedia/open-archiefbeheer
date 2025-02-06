from django.utils.translation import gettext_lazy as _

from rest_framework import permissions

from ..constants import ListStatus


class CanStartDestructionPermission(permissions.BasePermission):
    message = _("You are not allowed to create a destruction list.")

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")


class CanReviewPermission(permissions.BasePermission):
    message = _("You are not allowed to review a destruction list.")

    def has_permission(self, request, view):
        return request.user.has_perm(
            "accounts.can_review_destruction"
        ) or request.user.has_perm("accounts.can_review_final_list")

    def has_object_permission(self, request, view, destruction_list):
        user = request.user

        # User is not assigned
        if destruction_list.assignee != user:
            return False

        # User is not permitted based on role + status
        if (
            (
                destruction_list.status == ListStatus.ready_to_review
                and not user.has_perm("accounts.can_review_destruction")
            )
            or (
                destruction_list.status == ListStatus.ready_for_archivist
                and not user.has_perm("accounts.can_review_final_list")
            )
            or destruction_list.status
            not in [ListStatus.ready_to_review, ListStatus.ready_for_archivist]
        ):
            return False

        return True


class CanCoReviewPermission(permissions.BasePermission):
    message = _("You are not allowed to co-review a destruction list.")

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_co_review_destruction")

    def has_object_permission(self, request, view, destruction_list):
        user_assignees = destruction_list.assignees.values_list("user__pk", flat=True)
        user = request.user

        # User is not assigned
        if user.pk not in user_assignees:
            return False

        # User is not permitted based on role + status
        if (
            destruction_list.status == ListStatus.ready_to_review
            and not user.has_perm("accounts.can_co_review_destruction")
        ) or destruction_list.status != ListStatus.ready_to_review:
            return False
        return True


class CanUpdateDestructionList(permissions.BasePermission):
    message = _(
        "You are either not allowed to update this destruction list or "
        "the destruction list can currently not be updated."
    )

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status == ListStatus.new


class CanMarkListAsFinal(permissions.BasePermission):
    message = _(
        "You are either not allowed to mark this destruction list as final or "
        "the destruction list can currently not be updated."
    )

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status == ListStatus.internally_reviewed


class CanQueueDestruction(permissions.BasePermission):
    message = _(
        "You are either not allowed to queue the deletion of this destruction list or "
        "the destruction list can currently not be deleted."
    )

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status == ListStatus.ready_to_delete


class CanDeleteList(permissions.BasePermission):
    message = _(
        "You are either not allowed to delete this destruction list or "
        "the destruction list does not have the status '%(status)s'."
    ) % {"status": ListStatus.new}

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status == ListStatus.new


class CanReassignDestructionList(permissions.BasePermission):
    message = _("You are not allowed to reassign the destruction list.")

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status in [
            ListStatus.new,
            ListStatus.ready_to_review,
        ]


class CanMarkAsReadyToReview(permissions.BasePermission):
    message = _("You are not allowed to mark this destruction list as ready to review.")

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status == ListStatus.new


class CanAbortDestruction(permissions.BasePermission):
    message = _("You are not allowed to stop the planned destruction of the list.")

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status != ListStatus.new


class CanUpdateCoReviewers(permissions.BasePermission):
    message = _("You are not allowed to update the co-reviewers.")

    def has_permission(self, request, view):
        return request.user.has_perm(
            "accounts.can_review_destruction"
        ) or request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        if request.user.has_perm("accounts.can_review_destruction"):
            return destruction_list.status == ListStatus.ready_to_review

        if request.user.has_perm("accounts.can_start_destruction"):
            return destruction_list.status in [
                ListStatus.ready_to_review,
                ListStatus.new,
            ]

        return False


class CanDownloadReport(permissions.BasePermission):
    message = _("You cannot download the destruction report.")

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status == ListStatus.deleted

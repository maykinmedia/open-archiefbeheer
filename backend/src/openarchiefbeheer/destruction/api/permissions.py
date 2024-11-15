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


class CanCoReviewPermission(permissions.BasePermission):
    message = _("You are not allowed to co-review a destruction list.")

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_co_review_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.assignees.includes(request.user)


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


class CanTriggerDeletion(permissions.BasePermission):
    message = _(
        "You are either not allowed to delete this destruction list or "
        "the destruction list can currently not be deleted."
    )

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_start_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status == ListStatus.ready_to_delete


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
        return (
            destruction_list.status == ListStatus.ready_to_delete
            and destruction_list.planned_destruction_date
        )


class CanUpdateCoReviewers(permissions.BasePermission):
    message = _("You are not a main reviewer.")

    def has_permission(self, request, view):
        return request.user.has_perm("accounts.can_review_destruction")

    def has_object_permission(self, request, view, destruction_list):
        return destruction_list.status == ListStatus.ready_to_review

from django.utils.translation import gettext_lazy as _

from rest_framework import permissions

from ..constants import ListStatus


class CanStartDestructionPermission(permissions.BasePermission):
    message = _("You are not allowed to create a destruction list.")

    def has_permission(self, request, view):
        return request.user.role and request.user.role.can_start_destruction


class CanReviewPermission(permissions.BasePermission):
    message = _("You are not allowed to review a destruction list.")

    def has_permission(self, request, view):
        return request.user.role and request.user.role.can_review_destruction


class CanUpdateDestructionList(permissions.BasePermission):
    message = _(
        "You are either not allowed to update this destruction list or "
        "the destruction list can currently not be updated."
    )

    def has_permission(self, request, view):
        return request.user.role and request.user.role.can_start_destruction

    def has_object_permission(self, request, view, destruction_list):
        return (
            request.user == destruction_list.author
            and destruction_list.status == ListStatus.new
        )


class CanMarkListAsFinal(permissions.BasePermission):
    message = _(
        "You are either not allowed to mark this destruction list as final or "
        "the destruction list can currently not be updated."
    )

    def has_permission(self, request, view):
        return request.user.role and request.user.role.can_start_destruction

    def has_object_permission(self, request, view, destruction_list):
        return (
            request.user == destruction_list.author
            and destruction_list.status == ListStatus.internally_reviewed
        )


class CanTriggerDeletion(permissions.BasePermission):
    message = _(
        "You are either not allowed to delete this destruction list or "
        "the destruction list can currently not be deleted."
    )

    def has_permission(self, request, view):
        return request.user.role and request.user.role.can_start_destruction

    def has_object_permission(self, request, view, destruction_list):
        return (
            request.user == destruction_list.author
            and destruction_list.status == ListStatus.ready_to_delete
        )

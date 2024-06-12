from django.utils.translation import gettext_lazy as _

from rest_framework import permissions


class CanStartDestructionPermission(permissions.BasePermission):
    message = _("You are not allowed to create a destruction list.")

    def has_permission(self, request, view):
        return request.user.role and request.user.role.can_start_destruction


class CanReviewPermission(permissions.BasePermission):
    message = _("You are not allowed to review a destruction list.")

    def has_permission(self, request, view):
        return request.user.role and request.user.role.can_review_destruction

from typing import TYPE_CHECKING

from django.contrib.auth.models import BaseUserManager, Permission
from django.db.models import Q, QuerySet

if TYPE_CHECKING:
    from .models import User


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, username, email, password, **extra_fields):
        """
        Creates and saves a User with the given username, email and password.
        """
        if not username:
            raise ValueError("The given username must be set")
        email = self.normalize_email(email)
        username = self.model.normalize_username(username)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(username, email, password, **extra_fields)

    def _users_with_permission(self, permission: Permission) -> QuerySet["User"]:
        return self.filter(
            Q(groups__permissions=permission) | Q(user_permissions=permission)
        ).distinct()

    def main_reviewers(self) -> QuerySet["User"]:
        permission = Permission.objects.get(codename="can_review_destruction")
        return self._users_with_permission(permission)

    def archivists(self) -> QuerySet["User"]:
        permission = Permission.objects.get(codename="can_review_final_list")
        return self._users_with_permission(permission)

    def co_reviewers(self) -> QuerySet["User"]:
        permission = Permission.objects.get(codename="can_co_review_destruction")
        return self._users_with_permission(permission)

from dataclasses import dataclass
from typing import TYPE_CHECKING, Union

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from .models import User


def validate_max_permissions(
    current_user: "User", permissions=None, groups=None, is_superuser=None
):
    """
    Validate that the ``permissions``, ``groups`` and ``superuser``-flag are
    never more than the permissions of the ``current_user``.
    """
    if current_user.is_superuser:
        return

    if is_superuser:
        raise ValidationError(_("You need to be superuser to create other superusers."))

    allowed_permissions = current_user.get_all_permissions()

    given_permissions = set(
        [
            "{}.{}".format(*p)
            for p in permissions.all().values_list(
                "content_type__app_label", "codename"
            )
        ]
    )
    for group in groups.all():
        given_permissions.update(
            set(
                [
                    "{}.{}".format(*p)
                    for p in group.permissions.all().values_list(
                        "content_type__app_label", "codename"
                    )
                ]
            )
        )

    if not given_permissions.issubset(allowed_permissions):
        raise ValidationError(
            _("You cannot create or update a user with more permissions than yourself.")
        )


def validate_max_user_permissions(current_user: "User", target_user: "User") -> None:
    """
    Validate that the ``target_user`` permissions are never more than the
    permissions of the ``current_user``.
    """
    validate_max_permissions(
        current_user,
        target_user.user_permissions,
        target_user.groups,
        target_user.is_superuser,
    )


@dataclass
class UserData:
    username: str
    first_name: str = ""
    last_name: str = ""


def format_user(user: Union[dict, "User"]) -> str:
    if isinstance(user, dict):
        user = UserData(
            **{
                "username": user["username"],
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
            }
        )

    if user.first_name or user.last_name:
        full_name = "%s %s" % (user.first_name, user.last_name)
        return f"{full_name.strip()} ({user.username})"

    return user.username


def format_user_groups(groups: list[str]) -> str:
    return ", ".join(groups)

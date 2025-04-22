from django.contrib.auth.models import Permission
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from ..models import User


class RoleSerializer(serializers.Serializer):
    can_start_destruction = serializers.BooleanField(default=False)
    can_review_destruction = serializers.BooleanField(default=False)
    can_co_review_destruction = serializers.BooleanField(default=False)
    can_review_final_list = serializers.BooleanField(default=False)
    can_configure_application = serializers.BooleanField(default=False)

    class Meta:
        fields = (
            "can_start_destruction",
            "can_review_destruction",
            "can_co_review_destruction",
            "can_review_final_list",
            "can_configure_application",
        )


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField(
        help_text=_("The role of the user within the application logic."),
        allow_null=True,
    )

    class Meta:
        model = User
        fields = ("pk", "username", "first_name", "last_name", "email", "role")

    @extend_schema_field(RoleSerializer)
    def get_role(self, user: User) -> dict | None:
        """
        Annotating a `UserQuerySet` using `annotate_permissions` (or `annotate_user_permission` on
        `DestructionListQuerySet`) causes `user_permission_codenames` and `group_permission_codenames` to be set and
         used for serialization. This may improve performance in cases where otherwise an n+1 issues could occur.
        """

        # Retrieve all permission codenames.
        permissions = []

        try:
            permissions += user.user_permission_codenames
            permissions += user.group_permission_codenames

        except AttributeError:
            permissions = (
                Permission.objects.filter(Q(user=user) | Q(group__user=user))
                .distinct()
                .values_list("codename", flat=True)
            )

        permissions_set = set(permissions)

        data = {
            "can_start_destruction": "can_start_destruction" in permissions_set,
            "can_review_destruction": "can_review_destruction" in permissions_set,
            "can_co_review_destruction": "can_co_review_destruction" in permissions_set,
            "can_review_final_list": "can_review_final_list" in permissions_set,
            "can_configure_application": "can_configure_application" in permissions_set,
        }

        return RoleSerializer(data).data

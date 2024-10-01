from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from ..models import User


class RoleSerializer(serializers.Serializer):
    can_start_destruction = serializers.BooleanField()
    can_review_destruction = serializers.BooleanField()
    can_review_final_list = serializers.BooleanField()

    class Meta:
        fields = (
            "can_start_destruction",
            "can_review_destruction",
            "can_review_final_list",
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
        serializer = RoleSerializer(
            data={
                "can_review_destruction": user.has_perm(
                    "accounts.can_review_destruction"
                ),
                "can_start_destruction": user.has_perm(
                    "accounts.can_start_destruction"
                ),
                "can_review_final_list": user.has_perm(
                    "accounts.can_review_final_list"
                ),
            }
        )
        serializer.is_valid()

        return serializer.data

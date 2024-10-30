from django.contrib.auth.models import Permission
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from ..models import User


class RoleSerializer(serializers.Serializer):
    can_start_destruction = serializers.BooleanField(default=False)
    can_review_destruction = serializers.BooleanField(default=False)
    can_co_review_destruction = serializers.BooleanField(default=False)
    can_review_final_list = serializers.BooleanField(default=False)

    class Meta:
        fields = (
            "can_start_destruction",
            "can_review_destruction",
            "can_co_review_destruction",
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
        data = {}
        for permission in Permission.objects.filter(user=user):
            data[permission.codename] = True

        for group in user.groups.all():
            for permission in group.permissions.all():
                data[permission.codename] = True

        serializer = RoleSerializer(data=data)
        serializer.is_valid()

        return serializer.data

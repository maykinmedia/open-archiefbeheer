from rest_framework import serializers

from ..models import Role, User


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = (
            "name",
            "can_start_destruction",
            "can_review_destruction",
            "can_view_case_details",
        )


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer()

    class Meta:
        model = User
        fields = ("username", "first_name", "last_name", "email", "role")

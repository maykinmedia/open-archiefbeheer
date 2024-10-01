from rest_framework import serializers

from ..models import User


class RoleSerializer(serializers.Serializer):
    class Meta:
        fields = (
            "name",
            "can_start_destruction",
            "can_review_destruction",
            "can_review_final_list",
            "can_view_case_details",
        )


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer()

    class Meta:
        model = User
        fields = ("pk", "username", "first_name", "last_name", "email", "role")

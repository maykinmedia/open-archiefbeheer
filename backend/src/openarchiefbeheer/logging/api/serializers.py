from rest_framework import serializers
from timeline_logger.models import TimelineLog

from openarchiefbeheer.accounts.api.serializers import UserSerializer


class AuditTrailItemSerializer(serializers.ModelSerializer):
    message = serializers.CharField(source="get_message")
    user = UserSerializer()

    class Meta:
        model = TimelineLog
        fields = (
            "pk",
            "timestamp",
            "user",
            "message",
            "extra_data",
        )

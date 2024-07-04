from rest_framework import serializers

from ..models import ArchiveConfig


class ArchiveConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchiveConfig
        fields = ("zaaktypes_short_process",)

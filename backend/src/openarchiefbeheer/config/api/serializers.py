from rest_framework import serializers

from ..models import ArchiveConfig


class ArchiveConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchiveConfig
        fields = (
            "zaaktypes_short_process",
            "bronorganisatie",
            "zaaktype",
            "statustype",
            "resultaattype",
            "informatieobjecttype",
        )
        extra_kwargs = {
            "bronorganisatie": {"required": True, "allow_null": False},
            "zaaktype": {"required": True, "allow_null": False},
            "statustype": {"required": True, "allow_null": False},
            "resultaattype": {"required": True, "allow_null": False},
            "informatieobjecttype": {"required": True, "allow_null": False},
        }

from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from mozilla_django_oidc_db.models import OpenIDConnectConfig
from rest_framework import serializers
from rest_framework.reverse import reverse

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


class OIDCInfoSerializer(serializers.ModelSerializer):
    login_url = serializers.SerializerMethodField(
        label=_("OIDC authentication URL"),
        help_text=_(
            "URL where to start the OIDC login flow if it is enabled. If it is not enabled, it will be an empty string."
        ),
    )

    class Meta:
        model = OpenIDConnectConfig
        fields = (
            "enabled",
            "login_url",
        )

    @extend_schema_field(serializers.URLField)
    def get_login_url(self, config: OpenIDConnectConfig) -> str:
        if not config.enabled:
            return ""

        request = self.context.get("request")
        return reverse("oidc_authentication_init", request=request)

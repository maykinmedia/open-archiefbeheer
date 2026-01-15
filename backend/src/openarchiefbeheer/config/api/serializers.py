from django.conf import settings
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema_field
from mozilla_django_oidc_db.models import OIDCClient
from rest_framework import serializers
from rest_framework.reverse import reverse

from ..models import ArchiveConfig
from .validators import validate_rsin


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
            "bronorganisatie": {
                "required": True,
                "allow_null": False,
                "validators": [validate_rsin],
            },
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
        model = OIDCClient
        fields = (
            "enabled",
            "login_url",
        )

    @extend_schema_field(serializers.URLField)
    def get_login_url(self, config: OIDCClient) -> str:
        if not config.enabled:
            return ""

        request = self.context.get("request")
        return reverse("oidc_authentication_init", request=request)


class ApplicationInfoSerializer(serializers.Serializer):
    release = serializers.SerializerMethodField(
        label=_("Application version"),
        help_text=_(
            "This uses the git tag if one is present, otherwise it defaults to the git commit hash. "
            "If the commit hash cannot be resolved, it will be empty."
        ),
    )
    git_sha = serializers.SerializerMethodField(
        label=_("Application git commit hash"),
        help_text=_(
            "This returns the git commit hash if it can be resolved. "
            "Otherwise, it will be empty."
        ),
    )

    def get_release(self, data) -> str:
        return settings.RELEASE

    def get_git_sha(self, data) -> str:
        return settings.GIT_SHA

from django.utils.translation import gettext_lazy as _

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins
from rest_framework.viewsets import GenericViewSet
from timeline_logger.models import TimelineLog

from .filtersets import LogsFilterset
from .serializers import AuditTrailItemSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Logs"],
        summary=_("List logs"),
    ),
)
class LogsViewset(mixins.ListModelMixin, GenericViewSet):
    queryset = TimelineLog.objects.all()
    serializer_class = AuditTrailItemSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = LogsFilterset

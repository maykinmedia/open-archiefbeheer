from django.contrib.contenttypes.models import ContentType
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from django_filters import CharFilter, FilterSet, UUIDFilter
from timeline_logger.models import TimelineLog

from openarchiefbeheer.destruction.models import DestructionList


class LogsFilterset(FilterSet):
    destruction_list = UUIDFilter(
        field_name="destruction_list",
        method="filter_destruction_list",
        help_text=_("Retrieve the logs of a particular destruction list."),
    )
    event = CharFilter(
        field_name="event",
        method="filter_event",
        help_text=_("Retrieve the logs for a particular event."),
    )

    class Meta:
        model = TimelineLog
        fields = ("destruction_list",)

    def filter_destruction_list(
        self, queryset: QuerySet[TimelineLog], name: str, value: str
    ) -> QuerySet[TimelineLog]:
        destruction_list = DestructionList.objects.filter(uuid=value).first()
        if not destruction_list:
            return queryset.none()

        content_type = ContentType.objects.get_for_model(destruction_list)

        return queryset.filter(
            content_type=content_type,
            object_id=destruction_list.pk,
        )

    def filter_event(
        self, queryset: QuerySet[TimelineLog], name: str, value: str
    ) -> QuerySet[TimelineLog]:
        template = f"logging/{value}.txt"
        return queryset.filter(template=template)

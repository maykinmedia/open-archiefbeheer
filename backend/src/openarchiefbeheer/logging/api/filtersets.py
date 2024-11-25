from django.contrib.contenttypes.models import ContentType
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from django_filters import FilterSet, UUIDFilter
from timeline_logger.models import TimelineLog

from openarchiefbeheer.destruction.models import DestructionList


class LogsFilterset(FilterSet):
    destruction_list = UUIDFilter(
        field_name="destruction_list",
        method="filter_destruction_list",
        help_text=_("Retrieve the logs of a particular destruction list."),
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

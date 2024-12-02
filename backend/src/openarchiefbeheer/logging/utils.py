from datetime import datetime
from typing import Callable

from django.utils import timezone

from .logevent import TEMPLATE_FORMAT


def get_event_template(logging_func: Callable) -> str:
    return TEMPLATE_FORMAT % {"event": logging_func.__name__}


def get_readable_timestamp(
    timestamp: datetime, separator: str = " ", timespec: str = "minutes"
) -> str:
    return timestamp.astimezone(tz=timezone.get_default_timezone()).isoformat(
        sep=separator, timespec=timespec
    )

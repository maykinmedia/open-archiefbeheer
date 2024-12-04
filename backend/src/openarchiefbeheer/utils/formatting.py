from datetime import datetime

from django.utils import timezone


def get_readable_timestamp(
    timestamp: datetime, separator: str = " ", timespec: str = "minutes"
) -> str:
    return timestamp.astimezone(tz=timezone.get_default_timezone()).isoformat(
        sep=separator, timespec=timespec
    )

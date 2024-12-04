from typing import Callable

from .logevent import TEMPLATE_FORMAT


def get_event_template(logging_func: Callable) -> str:
    return TEMPLATE_FORMAT % {"event": logging_func.__name__}

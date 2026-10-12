TEMPLATE_FORMAT = "logging/%(event)s.txt"


def get_event_template(event: str) -> str:
    return TEMPLATE_FORMAT % {"event": event}

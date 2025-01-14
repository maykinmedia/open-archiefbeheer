from typing import Literal

from django import template
from django.conf import settings

from furl import furl

from ..models import DestructionList

register = template.Library()


@register.simple_tag
def destruction_list_link(
    destruction_list_name: str,
    page: Literal["review", "process-review", "edit"] | None = None,
) -> str:
    destruction_list = DestructionList.objects.get(name=destruction_list_name)

    link = furl(settings.FRONTEND_URL)
    # This path needs to remain in sync with the path used in the frontend!
    link.path /= "destruction-lists"
    link.path /= str(destruction_list.uuid)
    if page:
        link.path /= page
    return link.url

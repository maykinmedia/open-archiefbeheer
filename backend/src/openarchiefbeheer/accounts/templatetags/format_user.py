from django import template

from ..utils import format_user as _format_user

register = template.Library()


@register.filter(name="format_user")
def format_user(user: dict | None) -> str:
    if not user:
        return ""
    return _format_user(user)

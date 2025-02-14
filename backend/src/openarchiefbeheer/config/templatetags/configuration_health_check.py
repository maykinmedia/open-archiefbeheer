from django import template

from ..health_checks import is_configuration_complete

register = template.Library()


@register.inclusion_tag("configuration_health_check.html")
def configuration_health_check():
    result = is_configuration_complete()
    return result

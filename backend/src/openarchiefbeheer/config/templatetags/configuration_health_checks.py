from typing import Iterable

from django import template

from maykin_config_checks import HealthCheckResult, run_checks

from ..health_checks import checks_collector

register = template.Library()


@register.simple_tag
def run_health_checks() -> Iterable[HealthCheckResult]:
    return run_checks(checks_collector=checks_collector, include_success=True)

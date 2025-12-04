from typing import Iterable

from django import template

from maykin_health_checks.runner import HealthChecksRunner
from maykin_health_checks.types import HealthCheckResult

from ..health_checks import checks_collector

register = template.Library()


@register.simple_tag
def run_health_checks() -> Iterable[HealthCheckResult]:
    runner = HealthChecksRunner(checks_collector=checks_collector, include_success=True)
    return runner.run_checks()

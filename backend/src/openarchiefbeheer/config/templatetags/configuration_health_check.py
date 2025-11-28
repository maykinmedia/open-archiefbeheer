from typing import Iterable

from django import template

from maykin_health_checks.runner import HealthChecksRunner
from maykin_health_checks.types import HealthCheckResult

from ..health_checks import checks_collector

register = template.Library()


@register.inclusion_tag("configuration_health_check.html")
def configuration_health_check() -> dict[str, Iterable[HealthCheckResult]]:
    runner = HealthChecksRunner(checks_collector=checks_collector)
    return {"failed_checks": runner.run_checks()}

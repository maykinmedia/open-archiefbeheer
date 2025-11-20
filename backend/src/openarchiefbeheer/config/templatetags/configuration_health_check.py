from django import template

from maykin_health_checks.runner import HealthChecksRunner

from ..health_checks import HealthCheckResult, checks_collector

register = template.Library()


@register.inclusion_tag("configuration_health_check.html")
def configuration_health_check() -> list[HealthCheckResult]:
    runner = HealthChecksRunner(checks_collector=checks_collector)
    return runner.run_checks()

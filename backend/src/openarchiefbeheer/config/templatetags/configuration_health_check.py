from django import template

from maykin_health_checks.runner import HealthChecksRunner

from ...utils.health_checks import CheckResult
from ..health_checks import checks_collector

register = template.Library()


@register.inclusion_tag("configuration_health_check.html")
def configuration_health_check() -> dict[str, list[CheckResult]]:
    runner = HealthChecksRunner(checks_collector=checks_collector)
    return {"failed_checks": runner.run_checks()}

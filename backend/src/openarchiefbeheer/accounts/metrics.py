from collections.abc import Collection

from django.contrib.auth.models import Group
from django.db.models import Count

from opentelemetry import metrics

meter = metrics.get_meter("openarchiefbeheer.accounts")


def count_users_by_group(
    options: metrics.CallbackOptions,
) -> Collection[metrics.Observation]:
    """
    Get the amount of users for each group.

    Here we don't take into account roles calculated based on particular permissions
    like in UsersFilterset.filter_role method
    """
    groups = Group.objects.annotate(user_count=Count("user"))

    return [
        metrics.Observation(
            group.user_count,
            attributes={"group": group.name, "scope": "global"},
        )
        for group in groups
    ]


meter.create_observable_gauge(
    name="openarchiefbeheer.auth.user_by_group_count",
    description="The number of users aggregated by groups",
    unit=r"{user}",  # no unit so that the _ratio suffix is not added
    callbacks=[count_users_by_group],
)

logins = meter.create_counter(
    "openarchiefbeheer.auth.logins",
    unit="1",  # unitless count
    description="The number of successful user logins.",
)

logouts = meter.create_counter(
    "openarchiefbeheer.auth.logouts",
    unit="1",  # unitless count
    description="The number of user logouts.",
)

login_failures = meter.create_counter(
    "openarchiefbeheer.auth.login_failures",
    unit="1",  # unitless count
    description="The number of failed logins by users, including the admin.",
)

user_lockouts = meter.create_counter(
    "openarchiefbeheer.auth.user_lockouts",
    unit="1",  # unitless count
    description="The number of user lockouts because of failed logins.",
)

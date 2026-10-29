from typing import Collection

from django.db.models import Count

from opentelemetry import metrics

from .models import DestructionList

meter = metrics.get_meter("openarchiefbeheer.destruction")


destruction_lists_completed = meter.create_counter(
    "openarchiefbeheer.destruction.lists.completed",
    unit="1",
    description="Number of successfully completed destruction lists.",
)

destruction_lists_failed = meter.create_counter(
    "openarchiefbeheer.destruction.lists.failed",
    unit="1",
    description="Number of destruction lists that failed processing.",
)

destruction_list_items_completed = meter.create_counter(
    "openarchiefbeheer.destruction.items.completed",
    unit="1",
    description="Number of successfully processed destruction list items.",
)

destruction_list_items_failed = meter.create_counter(
    "openarchiefbeheer.destruction.items.failed",
    unit="1",
    description="Number of destruction list items that failed processing.",
)


def count_lists(options: metrics.CallbackOptions) -> Collection[metrics.Observation]:
    counts_by_status = DestructionList.objects.values("status").annotate(
        count=Count("pk")
    )

    return [
        metrics.Observation(
            value=agg["count"],
            attributes={
                "status": agg["status"],
                "scope": "global",
            },
        )
        for agg in counts_by_status
    ]


def count_list_items(
    options: metrics.CallbackOptions,
) -> Collection[metrics.Observation]:
    counts_by_list = DestructionList.objects.annotate(item_count=Count("items")).values(
        "name", "count"
    )
    return [
        metrics.Observation(
            value=agg["item_count"],
            attributes={
                "destruction_list.name": agg["name"],
                "scope": "global",
            },
        )
        for agg in counts_by_list
    ]


meter.create_observable_gauge(
    "openarchiefbeheer.destruction.lists",
    callbacks=[count_lists],
    unit="",
    description="Number of destruction lists.",
)

meter.create_observable_gauge(
    "openarchiefbeheer.destruction.items",
    callbacks=[count_lists],
    unit="",
    description="Number of destruction list items.",
)

from collections import defaultdict
from dataclasses import dataclass
from typing import Protocol, TypedDict


class InternalResults(TypedDict):
    deleted_resources: dict[str, list]
    created_resources: dict[str, list]
    resources_to_delete: dict[str, list]
    traceback: str = ""


class Store(Protocol):
    internal_results: InternalResults

    def save(self) -> None: ...
    def refresh_from_db(self) -> None: ...


@dataclass
class ResultStore:
    store: Store

    def get_internal_results(self) -> InternalResults:
        results = self.store.internal_results
        if not results.get("deleted_resources"):
            results["deleted_resources"] = defaultdict(list)

        if not results.get("resources_to_delete"):
            results["resources_to_delete"] = defaultdict(list)

        if not results.get("created_resources"):
            results["created_resources"] = defaultdict(list)

        return results

    def refresh_from_db(self) -> None:
        self.store.refresh_from_db()

    def add_deleted_resource(self, resource_type: str, value: str) -> None:
        results = self.get_internal_results()
        results["deleted_resources"][resource_type].append(value)
        self.save()

    def save(self) -> None:
        self.store.save()

    def has_resource_to_delete(self, resource_type: str) -> bool:
        results = self.get_internal_results()

        return (
            resource_type in results["resources_to_delete"]
            and len(results["resources_to_delete"][resource_type]) > 0
        )

    def has_created_resource(self, resource_type: str) -> bool:
        results = self.get_internal_results()

        return (
            resource_type in results["created_resources"]
            and len(results["created_resources"][resource_type]) > 0
        )

    def add_resource_to_delete(self, resource_type: str, value: str) -> None:
        results = self.get_internal_results()

        results["resources_to_delete"][resource_type].append(value)
        self.save()

    def add_created_resource(self, resource_type: str, value) -> None:
        results = self.get_internal_results()

        results["created_resources"][resource_type].append(value)
        self.save()

    def get_resources_to_delete(self, resource_type: str) -> list[str]:
        results = self.get_internal_results()
        return results["resources_to_delete"][resource_type]

    def get_created_resources(self, resource_type: str) -> list[str]:
        results = self.get_internal_results()
        return results["created_resources"][resource_type]

    def clear_resources_to_delete(self, resource_type: str) -> None:
        results = self.get_internal_results()
        del results["resources_to_delete"][resource_type]

    def add_traceback(self, formatted_traceback: str) -> None:
        results = self.get_internal_results()
        results["traceback"] = formatted_traceback
        self.save()

    def clear_traceback(self):
        results = self.get_internal_results()
        results["traceback"] = ""
        self.save()

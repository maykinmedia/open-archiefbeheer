from typing import Literal

from maykin_config_checks import Slug
from msgspec import UNSET, Struct, UnsetType, to_builtins

from openarchiefbeheer.types import JSONValue


class ExtraInfo(Struct):
    model: str
    code: str
    severity: Literal["error", "warning", "info"] = "error"
    message: str | UnsetType = UNSET
    field: str | UnsetType = UNSET


class CheckResult(Struct):
    identifier: Slug
    verbose_name: str
    success: bool
    message: str
    extra: list[ExtraInfo] | UnsetType = UNSET

    def to_builtins(self) -> JSONValue:
        return to_builtins(self)

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.utils.functional import _StrOrPromise
else:
    _StrOrPromise = str

JSONValue = dict[str, "JSONValue"] | list["JSONValue"] | str | int | float | bool | None
StrOrPromise = _StrOrPromise

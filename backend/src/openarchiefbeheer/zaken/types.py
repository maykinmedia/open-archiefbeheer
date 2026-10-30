from typing import NotRequired, TypedDict


class DropDownChoice(TypedDict):
    label: str
    value: str
    extra_data: NotRequired[dict]

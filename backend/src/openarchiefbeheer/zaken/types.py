from dataclasses import dataclass
from typing import Optional


@dataclass
class DropDownChoice:
    label: str
    value: str
    extra_data: Optional[int] = None

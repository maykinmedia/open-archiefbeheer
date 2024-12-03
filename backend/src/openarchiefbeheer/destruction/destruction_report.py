from dataclasses import dataclass
from typing import IO

from django.utils.translation import gettext

import xlsxwriter
from glom import glom
from xlsxwriter.worksheet import Worksheet

from openarchiefbeheer.zaken.api.constants import ZAAK_METADATA_FIELDS_MAPPINGS

from .constants import InternalStatus
from .models import DestructionList


@dataclass
class DestructionReportGenerator:
    destruction_list: DestructionList

    def add_zaken_table(self, worksheet: Worksheet, start_row: int = 0) -> None:
        worksheet.write_row(
            start_row, 0, [field["name"] for field in ZAAK_METADATA_FIELDS_MAPPINGS]
        )

        for row_count, item in enumerate(
            self.destruction_list.items.filter(
                processing_status=InternalStatus.succeeded
            ).iterator(chunk_size=1000)
        ):
            data = [
                glom(item.extra_zaak_data, field["path"], default="")
                for field in ZAAK_METADATA_FIELDS_MAPPINGS
            ]
            worksheet.write_row(start_row + row_count + 1, 0, data)

    def generate_destruction_report(self, file: IO) -> None:
        workbook = xlsxwriter.Workbook(file.name, options={"in_memory": False})

        worksheet = workbook.add_worksheet(name=gettext("Deleted zaken"))

        self.add_zaken_table(worksheet)

        workbook.close()

from dataclasses import dataclass
from typing import IO

from django.utils import timezone
from django.utils.translation import gettext

import xlsxwriter
from glom import glom
from timeline_logger.models import TimelineLog
from xlsxwriter.worksheet import Worksheet

from openarchiefbeheer.zaken.api.constants import ZAAK_METADATA_FIELDS_MAPPINGS

from .constants import InternalStatus
from .models import DestructionList


@dataclass
class DestructionReportGenerator:
    destruction_list: DestructionList

    def add_review_process_table(
        self, worksheet: Worksheet, start_row: int = 0
    ) -> None:
        column_names = [
            gettext("Group"),
            gettext("Name"),
            gettext("Date/Time"),
            gettext("Changes"),
        ]
        worksheet.write_row(start_row, 0, column_names)

        logs = TimelineLog.objects.for_object(self).filter(
            template="logging/destruction_list_reviewed.txt", extra_data__approved=True
        )
        for row_count, log in enumerate(logs):
            user_data = log.extra_data["user"]
            # Not using the FK because the user might have been deleted in the mean time
            formatted_user = f"{user_data["first_name"]} {user_data["last_name"]} ({user_data["username"]})"
            data = [
                ", ".join(log.extra_data["user_groups"]),
                formatted_user,
                log.timestamp.astimezone(tz=timezone.get_default_timezone()).isoformat(
                    sep=" ", timespec="minutes"
                ),
                # This column is not useful, since we are filtering on approved reviews.
                # But it was specifically requested.
                gettext("Has approved"),
            ]
            worksheet.write_row(start_row + row_count + 1, 0, data)

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

        worksheet_zaken = workbook.add_worksheet(name=gettext("Deleted zaken"))
        worksheet_review_process = workbook.add_worksheet(
            name=gettext("Review process")
        )

        self.add_zaken_table(worksheet_zaken)
        self.add_review_process_table(worksheet_review_process)

        workbook.close()

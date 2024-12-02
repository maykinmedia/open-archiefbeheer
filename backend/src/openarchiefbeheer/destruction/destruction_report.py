from dataclasses import dataclass
from typing import IO

from django.utils.translation import gettext as _

import xlsxwriter
from glom import glom
from timeline_logger.models import TimelineLog
from xlsxwriter.worksheet import Worksheet

from openarchiefbeheer.accounts.utils import format_user, format_user_groups
from openarchiefbeheer.logging.logevent import (
    destruction_list_deletion_triggered,
    destruction_list_reviewed,
)
from openarchiefbeheer.logging.utils import get_event_template, get_readable_timestamp
from openarchiefbeheer.zaken.api.constants import ZAAK_METADATA_FIELDS_MAPPINGS

from .constants import InternalStatus, ListItemStatus
from .models import DestructionList


@dataclass
class DestructionReportGenerator:
    destruction_list: DestructionList

    def add_review_process_table(
        self, worksheet: Worksheet, start_row: int = 0
    ) -> None:
        column_names = [
            _("Group"),
            _("Name"),
            _("Date/Time"),
            _("Changes"),
        ]
        worksheet.write_row(start_row, 0, column_names)

        logs = TimelineLog.objects.for_object(self.destruction_list).filter(
            template=get_event_template(destruction_list_reviewed),
            extra_data__approved=True,
        )
        for row_count, log in enumerate(logs):
            # Not using the FK because the user might have been deleted in the mean time
            data = [
                format_user_groups(log.extra_data["user_groups"]),
                format_user(log.extra_data["user"]),
                get_readable_timestamp(log.timestamp),
                # This column is not useful, since we are filtering on approved reviews.
                # But it was specifically requested.
                _("Has approved"),
            ]
            worksheet.write_row(start_row + row_count + 1, 0, data)

    def add_general_info_table(self, worksheet: Worksheet, start_row: int = 0) -> None:
        column_names = [
            _("Date/Time of deletion"),
            _("User who started the deletion"),
            _("Groups"),
            _("Number of deleted cases"),
        ]
        worksheet.write_row(start_row, 0, column_names)

        log = (
            TimelineLog.objects.for_object(self)
            .filter(template=get_event_template(destruction_list_deletion_triggered))
            .order_by("timestamp")
            .last()
        )
        number_of_cases = self.items.filter(
            processing_status=InternalStatus.succeeded,
            status=ListItemStatus.suggested,
        ).count()

        general_info_data = [
            get_readable_timestamp(self.end),
            format_user(log.extra_data["user"]),
            format_user_groups(log.extra_data["user_groups"]),
            number_of_cases,
        ]
        worksheet.write_row(start_row + 1, 0, general_info_data)

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

        worksheet_zaken = workbook.add_worksheet(name=_("Deleted zaken"))
        worksheet_review_process = workbook.add_worksheet(name=_("Review process"))

        self.add_general_info_table(worksheet_zaken)
        self.add_zaken_table(worksheet_zaken, start_row=3)
        self.add_review_process_table(worksheet_review_process)

        workbook.close()

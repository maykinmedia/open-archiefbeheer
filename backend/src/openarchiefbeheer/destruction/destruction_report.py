import itertools
from base64 import b64encode
from tempfile import NamedTemporaryFile
from typing import Generator
from uuid import UUID

from django.conf import settings
from django.core.files import File
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext as _

import xlsxwriter
from furl import furl
from glom import glom
from slugify import slugify
from timeline_logger.models import TimelineLog
from xlsxwriter.workbook import Workbook

from openarchiefbeheer.accounts.utils import format_user, format_user_groups
from openarchiefbeheer.clients import drc_client, zrc_client
from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.destruction.utils import get_selectielijstklasse
from openarchiefbeheer.logging.logevent import (
    destruction_list_deletion_triggered,
    destruction_list_reviewed,
)
from openarchiefbeheer.logging.utils import get_event_template
from openarchiefbeheer.utils.formatting import get_readable_timestamp
from openarchiefbeheer.zaken.api.constants import ZAAK_METADATA_FIELDS_MAPPINGS

from .constants import ResourceDestructionResultStatus
from .models import DestructionList, ResourceCreationResult, ResourceDestructionResult


def _add_review_process_worksheet(
    destruction_list: DestructionList, workbook: Workbook
) -> None:
    worksheet = workbook.add_worksheet(name=_("Process details"))

    def general_info() -> Generator[tuple[str, str, str, str, str], None, None]:
        yield (
            # When the record manager starts the deletion process
            _("Date/Time starting destruction"),
            _("Date/Time of destruction"),
            _("User who started the destruction"),
            _("Groups"),
            _("Number of deleted cases"),
        )

        log = (
            TimelineLog.objects.for_object(destruction_list)
            .filter(template=get_event_template(destruction_list_deletion_triggered))
            .order_by("timestamp")
            .last()
        )
        number_of_cases = ResourceDestructionResult.objects.filter(
            item__destruction_list=destruction_list,
            resource_type="zaken",
            status=ResourceDestructionResultStatus.deleted,
        ).count()

        assert destruction_list.end

        yield (
            get_readable_timestamp(log.timestamp),
            get_readable_timestamp(destruction_list.end),
            format_user(log.extra_data["user"]) if log else "",
            format_user_groups(log.extra_data["user_groups"]) if log else "",
            str(number_of_cases),
        )

    def events_data() -> Generator[tuple[str, str, str, str], None, None]:
        yield (
            _("Group"),
            _("Name"),
            _("Date/Time"),
            _("Changes"),
        )

        logs = TimelineLog.objects.for_object(destruction_list).filter(
            template=get_event_template(destruction_list_reviewed),
            extra_data__approved=True,
        )
        for log in logs:
            # Not using the FK because the user might have been deleted in the mean time
            yield (
                format_user_groups(log.extra_data["user_groups"]),
                format_user(log.extra_data["user"]),
                get_readable_timestamp(log.timestamp),
                # This column is not useful, since we are filtering on approved reviews.
                # But it was specifically requested.
                _("Has approved"),
            )

    empty_row = ("",)

    for row_number, row in enumerate(
        itertools.chain(general_info(), empty_row, events_data())
    ):
        worksheet.write_row(row_number, 0, row)


def _add_zaken_worksheet(
    destruction_list: DestructionList, workbook: Workbook, start_row: int = 0
) -> None:
    worksheet = workbook.add_worksheet(name=_("Deleted zaken"))

    worksheet.write_row(
        start_row, 0, [field["name"] for field in ZAAK_METADATA_FIELDS_MAPPINGS]
    )

    results = ResourceDestructionResult.objects.filter(
        item__destruction_list=destruction_list,
        resource_type="zaken",
        status=ResourceDestructionResultStatus.deleted,
    )

    for row_count, result in enumerate(results.iterator(chunk_size=1000)):
        data = [
            glom(result.metadata, field["path"], default="")
            for field in ZAAK_METADATA_FIELDS_MAPPINGS
        ]
        worksheet.write_row(start_row + row_count + 1, 0, data)


def _add_related_resources_worksheet(
    destruction_list: DestructionList, workbook: Workbook, start_row: int = 0
) -> None:
    worksheet = workbook.add_worksheet(name=_("Related resources"))

    worksheet.write_row(
        start_row, 0, [_("Resource Type"), _("Resource UUID"), _("Operation")]
    )

    results = ResourceDestructionResult.objects.filter(
        ~Q(resource_type="zaken"),
        Q(status=ResourceDestructionResultStatus.deleted)
        | Q(status=ResourceDestructionResultStatus.unlinked),
        item__destruction_list=destruction_list,
    )

    row_count = start_row + 1
    for result in results.iterator(chunk_size=1000):
        try:
            uuid_resource = furl(result.url).path.segments[-1]
            UUID(uuid_resource)
            identifier = uuid_resource
        except ValueError:
            # We can't extract the UUID from the URL of the resource. Fallback on the URL
            identifier = result.url

        worksheet.write_row(
            row_count,
            0,
            [
                result.resource_type,
                identifier,
                str(ResourceDestructionResultStatus(result.status).label),
            ],
        )
        row_count += 1


def generate_destruction_report(destruction_list: DestructionList) -> None:
    with NamedTemporaryFile(mode="wb", delete_on_close=False) as f_tmp:
        workbook = xlsxwriter.Workbook(f_tmp.name, options={"in_memory": False})

        _add_zaken_worksheet(destruction_list, workbook)
        _add_review_process_worksheet(destruction_list, workbook)
        _add_related_resources_worksheet(destruction_list, workbook)

        workbook.close()

        f_tmp.close()

        with open(f_tmp.name, mode="rb") as f:
            django_file = File(f)
            destruction_list.destruction_report.save(
                f"report_{slugify(destruction_list.name)}.xlsx", django_file
            )


def upload_destruction_report_to_openzaak(destruction_list: DestructionList) -> None:
    """Create a Zaak, a Resultaat, a Status, an EnkelvoudigInformatieObject and a ZaakInformatieObject."""
    config = ArchiveConfig.get_solo()

    with zrc_client() as client:
        if not destruction_list.zaak_destruction_report_url:
            response = client.post(
                "zaken",
                headers={
                    "Accept-Crs": "EPSG:4326",
                    "Content-Crs": "EPSG:4326",
                },
                json={
                    "bronorganisatie": config.bronorganisatie,
                    "omschrijving": _("Destruction report"),
                    "toelichting": _("Destruction report of list: %(list_name)s")
                    % {"list_name": destruction_list.name},
                    "zaaktype": config.zaaktype,
                    "vertrouwelijkheidaanduiding": "openbaar",
                    "startdatum": timezone.now().date().isoformat(),
                    "verantwoordelijkeOrganisatie": config.bronorganisatie,
                    "archiefnominatie": "blijvend_bewaren",
                    "selectielijstklasse": get_selectielijstklasse(
                        config.resultaattype
                    ),
                },
                timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            new_zaak = response.json()

            destruction_list.zaak_destruction_report_url = new_zaak["url"]
            destruction_list.save()

        if (
            config.resultaattype
            and not ResourceCreationResult.objects.filter(
                destruction_list=destruction_list, resource_type="resultaten"
            ).exists()
        ):
            response = client.post(
                "resultaten",
                json={
                    "zaak": destruction_list.zaak_destruction_report_url,
                    "resultaattype": config.resultaattype,
                },
                timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            ResourceCreationResult.objects.create(
                destruction_list=destruction_list,
                resource_type="resultaten",
                url=response.json()["url"],
            )

        if (
            config.statustype
            and not ResourceCreationResult.objects.filter(
                destruction_list=destruction_list, resource_type="statussen"
            ).exists()
        ):
            response = client.post(
                "statussen",
                json={
                    "zaak": destruction_list.zaak_destruction_report_url,
                    "statustype": config.statustype,
                    "datum_status_gezet": timezone.now().date().isoformat(),
                },
                timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            ResourceCreationResult.objects.create(
                destruction_list=destruction_list,
                resource_type="statussen",
                url=response.json()["url"],
            )

    if not (
        informatieobject := ResourceCreationResult.objects.filter(
            destruction_list=destruction_list,
            resource_type="enkelvoudiginformatieobjecten",
        ).last()
    ):
        with (
            drc_client() as client,
            destruction_list.destruction_report.open("rb") as f_report,
        ):
            response = client.post(
                "enkelvoudiginformatieobjecten",
                json={
                    "bronorganisatie": config.bronorganisatie,
                    "creatiedatum": timezone.now().date().isoformat(),
                    "titel": _("Destruction report of list: %(list_name)s")
                    % {"list_name": destruction_list.name},
                    "auteur": "Open Archiefbeheer",
                    "taal": "nld",
                    "formaat": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "inhoud": b64encode(f_report.read()).decode("utf-8"),
                    "informatieobjecttype": config.informatieobjecttype,
                    "indicatie_gebruiksrecht": False,
                },
                timeout=settings.REQUESTS_DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            informatieobject = ResourceCreationResult.objects.create(
                destruction_list=destruction_list,
                resource_type="enkelvoudiginformatieobjecten",
                url=response.json()["url"],
            )

    with zrc_client() as client:
        response = client.post(
            "zaakinformatieobjecten",
            json={
                "zaak": destruction_list.zaak_destruction_report_url,
                "informatieobject": informatieobject.url,
            },
        )
        response.raise_for_status()

    # Uploading has succeeded, delete the temporary resources that we created.
    ResourceCreationResult.objects.filter(destruction_list=destruction_list).delete()

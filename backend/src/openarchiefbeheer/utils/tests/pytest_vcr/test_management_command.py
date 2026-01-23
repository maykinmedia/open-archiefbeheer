from io import StringIO

from django.core.management import call_command

import pytest
from freezegun import freeze_time
from vcr.cassette import Cassette

from openarchiefbeheer.zaken.models import Zaak
from openarchiefbeheer.zaken.tasks import resync_zaken


@pytest.mark.django_db
def test_demo_data_command(openzaak_reload: None, vcr: Cassette) -> None:
    call_command(
        "create_demo_data",
        stdout=StringIO(),
    )

    with freeze_time("2026-01-16"):
        resync_zaken()

    assert Zaak.objects.count() == 5

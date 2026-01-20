from datetime import datetime
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from freezegun import freeze_time
from privates.test import temp_private_root
from requests_mock import Mocker
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.config.models import ArchiveConfig
from openarchiefbeheer.config.tests.factories import ArchiveConfigFactory
from openarchiefbeheer.destruction.destruction_report import (
    upload_destruction_report_to_openzaak,
)
from openarchiefbeheer.destruction.models import ResourceCreationResult
from openarchiefbeheer.utils.tests.mixins import ClearCacheMixin
from openarchiefbeheer.zaken.tests.factories import ZaakFactory

from ...accounts.tests.factories import UserFactory
from ..constants import (
    InternalStatus,
    ListItemStatus,
)
from .factories import (
    DestructionListCoReviewFactory,
    DestructionListFactory,
    DestructionListItemFactory,
    ReviewResponseFactory,
)


class DestructionListItemTest(ClearCacheMixin, TestCase):
    def test_set_status(self):
        destruction_list = DestructionListFactory.create()

        with freeze_time("2024-05-02T16:00:00+02:00"):
            destruction_list.set_status(ListItemStatus.removed)

        destruction_list.refresh_from_db()

        self.assertEqual(
            destruction_list.status_changed,
            timezone.make_aware(datetime(2024, 5, 2, 16, 0)),
        )

    def test_keeping_zaak_url_in_sync(self):
        zaak = ZaakFactory.create(url="http://zaken.nl/1")
        item = DestructionListItemFactory.create(
            with_zaak=True, zaak__url="http://zaken.nl/2"
        )

        self.assertEqual(item._zaak_url, "http://zaken.nl/2")

        item.zaak = zaak
        item.save()

        item.refresh_from_db()

        self.assertEqual(item._zaak_url, "http://zaken.nl/1")


class ReviewResponseTests(TestCase):
    def test_derive_status(self):
        review_response = ReviewResponseFactory.create()

        self.assertEqual(
            review_response._derive_status(
                [InternalStatus.new, InternalStatus.new, InternalStatus.new]
            ),
            InternalStatus.new,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                ]
            ),
            InternalStatus.succeeded,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.failed,
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                ]
            ),
            InternalStatus.failed,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.processing,
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                ]
            ),
            InternalStatus.processing,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.queued,
                    InternalStatus.succeeded,
                    InternalStatus.succeeded,
                ]
            ),
            InternalStatus.queued,
        )
        self.assertEqual(
            review_response._derive_status(
                [
                    InternalStatus.queued,
                    InternalStatus.failed,
                    InternalStatus.processing,
                ]
            ),
            InternalStatus.failed,
        )
        self.assertEqual(
            review_response._derive_status(
                [InternalStatus.queued, InternalStatus.new, InternalStatus.processing]
            ),
            InternalStatus.processing,
        )
        self.assertEqual(
            review_response._derive_status(
                [InternalStatus.new, InternalStatus.new, InternalStatus.succeeded]
            ),
            InternalStatus.processing,
        )


TEST_DATA_ARCHIVE_CONFIG = {
    "bronorganisatie": "000000000",
    "zaaktype": "ZAAKTYPE-2018-0000000002",
    "statustype": "http://localhost:8003/catalogi/api/v1/statustypen/835a2a13-f52f-4339-83e5-b7250e5ad016",
    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
    "informatieobjecttype": "http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
}

TEST_DATA_ARCHIVE_CONFIG_PARTIAL = {
    "bronorganisatie": "000000000",
    "zaaktype": "ZAAKTYPE-2018-0000000002",
    "informatieobjecttype": "http://localhost:8003/catalogi/api/v1/informatieobjecttypen/9dee6712-122e-464a-99a3-c16692de5485",
    "resultaattype": "http://localhost:8003/catalogi/api/v1/resultaattypen/5d39b8ac-437a-475c-9a76-0f6ae1540d0e",
}


@temp_private_root()
class DestructionListTest(TestCase):
    def test_has_long_review_process(self):
        destruction_list = DestructionListFactory.create()

        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktypen/111-111-111",
            zaak__post___expand={
                "zaaktype": {
                    "identificatie": "ZAAKTYPE-01",
                    "omschrijving": "ZAAKTYPE-01",
                    "versiedatum": "2024-01-01",
                    "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                }
            },
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktypen/111-111-111",
            zaak__post___expand={
                "zaaktype": {
                    "identificatie": "ZAAKTYPE-01",
                    "omschrijving": "ZAAKTYPE-01",
                    "versiedatum": "2024-01-01",
                    "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                }
            },
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktypen/222-222-222",
            zaak__post___expand={
                "zaaktype": {
                    "identificatie": "ZAAKTYPE-02",
                    "omschrijving": "ZAAKTYPE-02",
                    "versiedatum": "2024-01-02",
                    "url": "http://catalogue-api.nl/zaaktypen/222-222-222",
                }
            },
        )

        with patch(
            "openarchiefbeheer.destruction.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(zaaktypes_short_process=["ZAAKTYPE-01"]),
        ):
            has_short_review_process = destruction_list.has_short_review_process()

        self.assertFalse(has_short_review_process)

    def test_has_short_review_process(self):
        destruction_list = DestructionListFactory.create()

        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktypen/1",
            zaak__post___expand={
                "zaaktype": {
                    "identificatie": "ZAAKTYPE-01",
                    "omschrijving": "ZAAKTYPE-01",
                    "versiedatum": "2024-01-01",
                    "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                }
            },
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktypen/1",
            zaak__post___expand={
                "zaaktype": {
                    "identificatie": "ZAAKTYPE-01",
                    "omschrijving": "ZAAKTYPE-01",
                    "versiedatum": "2024-01-01",
                    "url": "http://catalogue-api.nl/zaaktypen/111-111-111",
                }
            },
        )
        DestructionListItemFactory.create(
            destruction_list=destruction_list,
            with_zaak=True,
            zaak__zaaktype="http://catalogi-api.nl/zaaktypen/222-222-222",
            zaak__post___expand={
                "zaaktype": {
                    "identificatie": "ZAAKTYPE-02",
                    "omschrijving": "ZAAKTYPE-02",
                    "versiedatum": "2024-01-02",
                    "url": "http://catalogue-api.nl/zaaktypen/222-222-222",
                }
            },
        )

        with patch(
            "openarchiefbeheer.destruction.models.ArchiveConfig.get_solo",
            return_value=ArchiveConfig(
                zaaktypes_short_process=[
                    "ZAAKTYPE-01",
                    "ZAAKTYPE-02",
                ]
            ),
        ):
            has_short_review_process = destruction_list.has_short_review_process()

        self.assertTrue(has_short_review_process)

    @Mocker()
    def test_resume_after_failure(self, m):
        destruction_list = DestructionListFactory.create(
            zaak_destruction_report_url="http://localhost:8003/zaken/api/v1/zaken/111-111-111"
        )
        # Fake intermediate results that are created during failures
        ResourceCreationResult.objects.create(
            destruction_list=destruction_list,
            resource_type="resultaten",
            url="http://localhost:8003/zaken/api/v1/resultaten/111-111-111",
        )
        ResourceCreationResult.objects.create(
            destruction_list=destruction_list,
            resource_type="statussen",
            url="http://localhost:8003/zaken/api/v1/statussen/111-111-111",
        )
        ResourceCreationResult.objects.create(
            destruction_list=destruction_list,
            resource_type="enkelvoudiginformatieobjecten",
            url="http://localhost:8003/documenten/api/v1/enkelvoudiginformatieobjecten/111-111-111",
        )

        ServiceFactory.create(
            api_type=APITypes.zrc,
            api_root="http://localhost:8003/zaken/api/v1",
        )
        ServiceFactory.create(
            api_type=APITypes.ztc,
            api_root="http://localhost:8003/catalogi/api/v1",
        )

        m.post(
            "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten",
            json={
                "url": "http://localhost:8003/zaken/api/v1/zaakinformatieobjecten/111-111-111"
            },
        )

        # Calling create_report_zaak resumes from where there is no stored intermediate result (i.e. creating the ZIO)
        ArchiveConfigFactory.create(**TEST_DATA_ARCHIVE_CONFIG)

        upload_destruction_report_to_openzaak(destruction_list)

        self.assertTrue(m.called_once)
        self.assertFalse(
            ResourceCreationResult.objects.filter(
                destruction_list=destruction_list
            ).exists()
        )


class DestructionListCoReviewTest(TestCase):
    def test_destruction_list_hierarchy(self):
        co_review = DestructionListCoReviewFactory.create()
        self.assertTrue(co_review.created)

        destruction_list = co_review.destruction_list
        self.assertIn(co_review, destruction_list.co_reviews.all())

    def test_author_list_hierarchy(self):
        co_review = DestructionListCoReviewFactory.create()
        author = co_review.author
        self.assertIn(co_review, author.created_co_reviews.all())

    def test_str(self):
        destruction_list = DestructionListFactory(name="Destruction list to co-review")
        author = UserFactory.create(
            username="co-reviewer", first_name="Co", last_name="Reviewer"
        )
        co_review = DestructionListCoReviewFactory.create(
            destruction_list=destruction_list, author=author
        )

        self.assertEqual(
            str(co_review),
            "Co-review for Destruction list to co-review (Co Reviewer (co-reviewer))",
        )

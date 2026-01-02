from django.test import Client

import pytest
from rest_framework import status
from rest_framework.reverse import reverse
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.utils.tests.resources_client import OpenZaakDataCreationHelper


@pytest.mark.django_db
def test_retrieve_all_statustypen_choices(
    openzaak_reload: None, vcr: None, client: Client
) -> None:
    ServiceFactory.create(
        slug="catalogi",
        api_type=APITypes.ztc,
        api_root="http://localhost:8003/catalogi/api/v1",
        client_id="test-vcr",
        secret="test-vcr",
    )

    user = UserFactory.create()
    helper = OpenZaakDataCreationHelper(
        zrc_service_slug="zaken",
        ztc_service_slug="catalogi",
        drc_service_slug="documents",
    )
    # Creates 2 statustypen
    resources1 = helper.create_zaaktype_with_relations(
        **{
            "omschrijving": "Zaaktype for testing 1",
            "identificatie": "ZAAKTYPE-TEST-01",
        },  # pyright: ignore[reportArgumentType]
    )
    assert isinstance(resources1["zaaktype"]["url"], str)
    helper.publish_zaaktype(resources1["zaaktype"]["url"])
    resources2 = helper.create_zaaktype_with_relations(
        **{
            "omschrijving": "Zaaktype for testing 2",
            "identificatie": "ZAAKTYPE-TEST-02",
        },  # pyright: ignore[reportArgumentType]
    )
    assert isinstance(resources2["zaaktype"]["url"], str)
    helper.publish_zaaktype(resources2["zaaktype"]["url"])

    client.force_login(user=user)
    response = client.get(reverse("api:retrieve-destructionreport-statustype-choices"))

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    assert len(data) == 4

    results = [statustype["value"] for statustype in data]
    expected_results = []
    for statustype in list(resources1["statustypen"]) + list(resources2["statustypen"]):
        assert isinstance(statustype["url"], str)
        expected_results.append(statustype["url"])

    assert sorted(results) == sorted(expected_results)

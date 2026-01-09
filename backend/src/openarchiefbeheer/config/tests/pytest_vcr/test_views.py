import contextlib

from django.test import Client

import pytest
from rest_framework import status
from rest_framework.reverse import reverse
from zgw_consumers.constants import APITypes
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.utils.tests.resources_client import OpenZaakDataCreationHelper


@pytest.mark.django_db
def test_retrieve_statustypen_choices_not_authenticated(client: Client) -> None:
    response = client.get(reverse("api:retrieve-destructionreport-statustype-choices"))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_retrieve_resultaattypen_choices_not_authenticated(client: Client) -> None:
    response = client.get(
        reverse("api:retrieve-destructionreport-resultaattype-choices")
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_retrieve_informatieobjecttypen_choices_not_authenticated(
    client: Client,
) -> None:
    response = client.get(
        reverse("api:retrieve-destructionreport-informatieobjecttype-choices")
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_retrieve_zaaktypen_shortprocess_not_authenticated(client: Client) -> None:
    response = client.get(reverse("api:retrieve-shortprocess-zaaktypen-choices"))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_retrieve_zaaktypen_destruction_report_not_authenticated(
    client: Client,
) -> None:
    response = client.get(reverse("api:retrieve-destructionreport-zaaktypen-choices"))

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_retrieve_statustypen_choices(
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

    # Replace with context manager subtests when we upgrade to pytest 9
    with contextlib.nullcontext(enter_result="Retrieve all the statustype choices"):
        response = client.get(
            reverse("api:retrieve-destructionreport-statustype-choices")
        )

        assert response.status_code == status.HTTP_200_OK

        data = response.json()

        assert len(data) == 4

        results = [statustype["value"] for statustype in data]
        for statustype in list(resources1["statustypen"]) + list(
            resources2["statustypen"]
        ):
            assert statustype["url"] in results

    with contextlib.nullcontext(
        enter_result="Retrieve statustype choices per zaaktype"
    ):
        response = client.get(
            reverse("api:retrieve-destructionreport-statustype-choices"),
            QUERY_STRING=f"zaaktype={resources1['zaaktype']['url']}",
        )

        assert response.status_code == status.HTTP_200_OK

        data = response.json()

        assert len(data) == 2

        results = [statustype["value"] for statustype in data]
        for statustype in resources1["statustypen"]:
            assert statustype["url"] in results


@pytest.mark.django_db
def test_retrieve_zaaktypen_shortprocess(
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

    for _ in range(2):
        resources = helper.create_zaaktype_with_relations()
        assert isinstance(resources["zaaktype"]["url"], str)
        helper.publish_zaaktype(resources["zaaktype"]["url"])

    client.force_login(user=user)
    response = client.get(reverse("api:retrieve-shortprocess-zaaktypen-choices"))

    assert response.status_code == status.HTTP_200_OK

    zaaktype_choices = response.json()

    assert len(zaaktype_choices) == 2

    for choice in zaaktype_choices:
        assert (
            "http://" not in choice["value"]
        )  # The value is the identificatie, not the URL!


@pytest.mark.django_db
def test_retrieve_zaaktypen_destruction_report(
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

    for _ in range(2):
        resources = helper.create_zaaktype_with_relations()
        assert isinstance(resources["zaaktype"]["url"], str)
        helper.publish_zaaktype(resources["zaaktype"]["url"])

    client.force_login(user=user)
    response = client.get(reverse("api:retrieve-destructionreport-zaaktypen-choices"))

    assert response.status_code == status.HTTP_200_OK

    zaaktype_choices = response.json()

    assert len(zaaktype_choices) == 2

    for choice in zaaktype_choices:
        assert (
            "http://" in choice["value"]
        )  # The value is the URL, not the identificatie!


@pytest.mark.django_db
def test_retrieve_informatieobjecttypen_destruction_report(
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

    # Create one zaaktype with a related informatieobjecttype
    resources1 = helper.create_zaaktype_with_relations()
    assert isinstance(resources1["zaaktype"]["url"], str) and isinstance(
        resources1["zaaktype"]["catalogus"], str
    )
    iot1 = helper.create_informatieobjecttype(
        catalogus_url=resources1["zaaktype"]["catalogus"]
    )
    assert isinstance(iot1["url"], str)
    helper.relate_zaaktype_informatieobjecttype(
        informatieobjecttype_url=iot1["url"], zaaktype_url=resources1["zaaktype"]["url"]
    )
    helper.publish_informatieobjecttype(iot1["url"])
    helper.publish_zaaktype(resources1["zaaktype"]["url"])

    # Create another zaaktype with a related informatieobjecttype
    resources2 = helper.create_zaaktype_with_relations()
    assert isinstance(resources2["zaaktype"]["url"], str) and isinstance(
        resources2["zaaktype"]["catalogus"], str
    )
    iot2 = helper.create_informatieobjecttype(
        catalogus_url=resources2["zaaktype"]["catalogus"]
    )
    assert isinstance(iot2["url"], str)
    helper.relate_zaaktype_informatieobjecttype(
        informatieobjecttype_url=iot2["url"], zaaktype_url=resources2["zaaktype"]["url"]
    )
    helper.publish_informatieobjecttype(iot2["url"])
    helper.publish_zaaktype(resources2["zaaktype"]["url"])

    client.force_login(user=user)

    with contextlib.nullcontext(
        enter_result="Retrieve all the informatieobjecttypen choices"
    ):
        response = client.get(
            reverse("api:retrieve-destructionreport-informatieobjecttype-choices"),
        )

        assert response.status_code == status.HTTP_200_OK

        iot_choices = response.json()

        assert len(iot_choices) == 2

    with contextlib.nullcontext(
        enter_result="Retrieve informatieobjecttypen choices per zaaktype"
    ):
        response = client.get(
            reverse("api:retrieve-destructionreport-informatieobjecttype-choices"),
            QUERY_STRING=f"zaaktype={resources1['zaaktype']['url']}",
        )

        assert response.status_code == status.HTTP_200_OK

        iot_choices = response.json()

        assert len(iot_choices) == 1
        assert iot1["url"] == iot_choices[0]["value"]


@pytest.mark.django_db
def test_retrieve_resultaattypen_destruction_report(
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
    resources1 = helper.create_zaaktype_with_relations()
    assert isinstance(resources1["zaaktype"]["url"], str)
    helper.publish_zaaktype(resources1["zaaktype"]["url"])
    resources2 = helper.create_zaaktype_with_relations()
    assert isinstance(resources2["zaaktype"]["url"], str)
    helper.publish_zaaktype(resources2["zaaktype"]["url"])

    client.force_login(user=user)

    # Replace with context manager subtests when we upgrade to pytest 9
    with contextlib.nullcontext(enter_result="Retrieve all the resultaattypen choices"):
        response = client.get(
            reverse("api:retrieve-destructionreport-resultaattype-choices")
        )

        assert response.status_code == status.HTTP_200_OK

        data = response.json()

        assert len(data) == 2

        results = [resultaattype["value"] for resultaattype in data]

        assert resources1["resultaattype"]["url"] in results
        assert resources2["resultaattype"]["url"] in results

    with contextlib.nullcontext(
        enter_result="Retrieve resultaattypen choices per zaaktype"
    ):
        response = client.get(
            reverse("api:retrieve-destructionreport-resultaattype-choices"),
            QUERY_STRING=f"zaaktype={resources1['zaaktype']['url']}",
        )

        assert response.status_code == status.HTTP_200_OK

        data = response.json()

        assert len(data) == 1
        assert resources1["resultaattype"]["url"] == data[0]["value"]

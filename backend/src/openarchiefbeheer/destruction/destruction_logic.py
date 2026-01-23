import logging
from collections import defaultdict

from django.conf import settings

from ape_pie import APIClient
from furl import furl
from requests import Response
from rest_framework import status

from openarchiefbeheer.clients import brc_client, drc_client, zrc_client
from openarchiefbeheer.external_registers.registry import register as registry
from openarchiefbeheer.external_registers.utils import get_plugin_for_related_object
from openarchiefbeheer.zaken.utils import (
    get_zaak_metadata,
    pagination_helper,
)

from .constants import ResourceDestructionResultStatus
from .models import DestructionListItem, ResourceDestructionResult

logger = logging.getLogger(__name__)


def _delete_resource(client: APIClient, url: str) -> Response:
    response = client.delete(url, timeout=settings.REQUESTS_DEFAULT_TIMEOUT)
    if (
        response.status_code == status.HTTP_400_BAD_REQUEST
        and response.json()["invalidParams"][0]["code"] == "pending-relations"
    ):
        # The resource has pending relations, cannot delete
        return response
    if response.status_code == status.HTTP_404_NOT_FOUND:
        # Could not be found, nothing to delete
        return response
    response.raise_for_status()
    return response


def delete_external_relations(
    item: DestructionListItem,
) -> None:
    """Delete relations to a zaak in supported external registers.

    * First retrieve the ZaakObjects related to the zaak.
    * Determine which plugin to use for deleting each supported external resource.
    * Let the plugin delete/unlink the resource.

    The ZaakObjects themselves will be cleaned up by Open Zaak when the Zaak is deleted.
    Therefore, OAB does not need to delete them.
    """
    assert item.zaak

    with zrc_client() as client:
        response = client.get("zaakobjecten", params={"zaak": item.zaak.url})
        response.raise_for_status()

        related_objects_to_delete = defaultdict(list)
        for page in pagination_helper(client, response.json()):
            for zaakobject in page["results"]:
                if zaakobject["url"] in item.excluded_relations:
                    continue

                if plugin := get_plugin_for_related_object(zaakobject["object"]):
                    related_objects_to_delete[plugin.identifier].append(
                        zaakobject["object"]
                    )

    for plugin_identifier in related_objects_to_delete:
        plugin = registry[plugin_identifier]
        plugin.delete_related_resources(
            item,
            related_resources=related_objects_to_delete[plugin_identifier],
        )


def delete_besluiten_and_besluiteninformatieobjecten(item: DestructionListItem) -> None:
    """Delete decisions related to the zaak and besluiten informatie objecten.

    This automatically deletes ZaakBesluiten in the Zaken API.
    The objects relating a besluit to a document are also deleted (BesluitInformatieObject).
    We mark the document itself (EIO) for later deletion.
    """
    assert item.zaak

    with brc_client() as client:
        response = client.get("besluiten", params={"zaak": item.zaak.url})
        response.raise_for_status()

        data = response.json()
        if data["count"] == 0:
            return

        data_iterator = pagination_helper(
            client,
            data,
            params={"zaak": item.zaak.url},
        )

        for data in data_iterator:
            for besluit in data["results"]:
                # Delete the BesluitInformatieObjecten (they relate a Besluit to an EnkelvoudigInformatieObject in Open Zaak)
                response = client.get(
                    "besluitinformatieobjecten", params={"besluit": besluit["url"]}
                )
                response.raise_for_status()

                besluitinformatieobjecten = response.json()

                for bio in besluitinformatieobjecten:
                    # Before deleting the BesluitInformatieObject, we save the URL of the EnkelvoudigInformatieObject to be able to
                    # delete it afterwards (you can't delete the EnkelvoudigInformatieObject if it still has relations!).
                    ResourceDestructionResult.objects.create(
                        item=item,
                        resource_type="enkelvoudiginformatieobjecten",
                        status=ResourceDestructionResultStatus.to_be_deleted,
                        url=bio["informatieobject"],
                    )

                    bio_uuid = furl(bio["url"]).path.segments[-1]
                    # TODO: check if we want to log with a ResourceDestructionResult the deletion of BIOs (#990)
                    _delete_resource(client, f"besluitinformatieobjecten/{bio_uuid}")
                    logger.info(
                        "besluitinformatieobject_deleted", extra={"url": bio["url"]}
                    )

                besluit_uuid = furl(besluit["url"]).path.segments[-1]
                response = _delete_resource(client, f"besluiten/{besluit_uuid}")
                logger.info("besluit_deleted", extra={"url": besluit["url"]})

                ResourceDestructionResult.objects.create(
                    item=item,
                    resource_type="besluiten",
                    status=(
                        ResourceDestructionResultStatus.deleted
                        if response.status_code == status.HTTP_204_NO_CONTENT
                        else ResourceDestructionResultStatus.unlinked
                    ),
                    url=besluit["url"],
                )


def delete_zaakinformatieobjecten(item: DestructionListItem) -> None:
    """Delete ZaakInformatieObjecten and store the relation to EnkelvoudigInformatieObjecten to be deleted later."""
    assert item.zaak

    with zrc_client() as client:
        response = client.get("zaakinformatieobjecten", params={"zaak": item.zaak.url})
        response.raise_for_status()

        zaakinformatieobjecten = response.json()

        if len(zaakinformatieobjecten) == 0:
            return

        for zio in zaakinformatieobjecten:
            # Before deleting the ZaakInformatieObject, we save the URL of the EnkelvoudigInformatieObject to be able to
            # delete it afterwards (you can't delete the EnkelvoudigInformatieObject if it still has relations!).
            ResourceDestructionResult.objects.create(
                item=item,
                resource_type="enkelvoudiginformatieobject",
                status=ResourceDestructionResultStatus.to_be_deleted,
                url=zio["url"],
            )

            zio_uuid = furl(zio["url"]).path.segments[-1]
            # TODO: check if we want to log with a ResourceDestructionResult the deletion of ZIOs (#990)
            _delete_resource(client, f"zaakinformatieobjecten/{zio_uuid}")
            logger.info("zaakinformatieobject_deleted", extra={"url": zio["url"]})


def delete_enkelvoudiginformatieobjecten(item: DestructionListItem) -> None:
    eios_to_delete = ResourceDestructionResult.objects.filter(
        item=item,
        resource_type="enkelvoudiginformatieobjecten",
        status=ResourceDestructionResultStatus.to_be_deleted,
    )
    with drc_client() as client:
        for eio in eios_to_delete:
            document_uuid = furl(eio.url).path.segments[-1]
            response = _delete_resource(
                client, f"enkelvoudiginformatieobjecten/{document_uuid}"
            )
            logger.info("enkelvoudiginformatieobject_deleted", extra={"url": eio.url})

            eio.status = (
                ResourceDestructionResultStatus.deleted
                if response.status_code == status.HTTP_204_NO_CONTENT
                else ResourceDestructionResultStatus.unlinked
            )
            eio.save()


def delete_zaak(item: DestructionListItem) -> None:
    """Delete a Zaak.

    We have already deleted/unlinked all relations of the zaak, so now we can delete the Zaak
    itself in Open Zaak.

    We also clean up the local zaak in OAB. We temporarily keep some metadata for the destruction
    report.
    """
    assert item.zaak

    result = ResourceDestructionResult.objects.create(
        item=item,
        resource_type="zaken",
        status=ResourceDestructionResultStatus.to_be_deleted,
        url=item.zaak.url,
        metadata=get_zaak_metadata(item.zaak),
    )

    with zrc_client() as client:
        _delete_resource(client, f"zaken/{item.zaak.uuid}")
        logger.info("zaak_deleted", extra={"url": item.zaak.url})
        result.status = ResourceDestructionResultStatus.deleted
        result.save()

    # Clean up Zaak object in OAB
    item.zaak.delete()
    item.zaak = None
    item._zaak_url = ""
    item.save()

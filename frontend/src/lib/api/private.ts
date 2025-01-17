import { Option } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { cacheMemo } from "../cache/cache";
import { DestructionList } from "./destructionLists";
import { request } from "./request";
import { Review } from "./review";

/**
 * Retrieve informatieobjecttypen from Open Zaak and return a value and a label per informatieobjecttype. The label is
 * the field 'omschrijving'.
 */
export async function listInformatieObjectTypeChoices(zaaktypeUrl?: string) {
  return cacheMemo(
    "listInformatieObjectTypeChoices",
    async () => {
      const response = await request("GET", "/_informatieobjecttype-choices/", {
        zaaktype: zaaktypeUrl,
      });
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [zaaktypeUrl],
  );
}

/**
 * Retrieve statustypen from Open Zaak and return a value and a label per statustype. The label is the field
 * 'omschrijving'.
 */
export async function listStatusTypeChoices(zaaktypeUrl?: string) {
  return cacheMemo(
    "listStatusTypeChoices",
    async () => {
      const response = await request("GET", "/_statustype-choices/", {
        zaaktype: zaaktypeUrl,
      });
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [zaaktypeUrl],
  );
}

/**
 * Retrieve resultaattypen from Open Zaak and return a value and a label per
 * resultaattype. The label is the field 'omschrijving'.
 */
export async function listResultaatTypeChoices(zaaktypeUrl?: string) {
  return cacheMemo(
    "listResultaatTypeChoices",
    async () => {
      const response = await request("GET", "/_resultaattype-choices/", {
        zaaktype: zaaktypeUrl,
      });
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [zaaktypeUrl],
  );
}

/**
 * This takes the 'selectielijstprocestype' from the 'zaaktype', then retrieves all the 'resultaten' possible for this
 * 'procestype' from the selectielijst API.
 */
export async function listSelectielijstKlasseChoices(
  params?:
    | URLSearchParams
    | {
        zaak?: Zaak["url"];
      },
) {
  // @ts-expect-error - check
  const zaak = params?.zaak as string | undefined;

  return cacheMemo(
    "listSelectielijstKlasseChoices",
    async () => {
      const response = await request(
        "GET",
        "/_selectielijstklasse-choices/",
        params,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    zaak ? [zaak] : undefined,
  );
}

/**
 * Retrieve zaaktypen from Open Zaak and return a value and a label per zaaktype. The label is the 'omschrijving' field
 * an the value is the URL. The response is cached for 15 minutes.
 */
export async function listZaaktypeChoices(
  destructionListUuid?: DestructionList["uuid"],
  reviewPk?: Review["pk"],
  searchParams?: URLSearchParams,
) {
  const params = [destructionListUuid, reviewPk, searchParams]
    .filter((param) => !!param)
    .map((param) => String(param));

  return cacheMemo(
    "listZaaktypeChoices",
    async () => {
      if (!searchParams) searchParams = new URLSearchParams();

      const params = new URLSearchParams({
        ...Object.fromEntries(searchParams),
      });

      if (reviewPk) {
        params.set("inReview", String(reviewPk));
      } else if (destructionListUuid) {
        params.set("inDestructionList", destructionListUuid);
      } else {
        params.set("notInDestructionList", "true");
      }

      const response = await request("GET", "/_zaaktypen-choices/", params);
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    params,
  );
}

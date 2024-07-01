import { Option } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { cacheMemo } from "../cache/cache";
import { DestructionList } from "./destructionLists";
import { request } from "./request";
import { Review } from "./review";

export type ZaaktypeChoice = Option & {
  /** A combination of the identification and the date on which the zaaktype will no longer be valid (if present). */
  extra: string;
};

/**
 * This takes the 'selectielijstprocestype' from the 'zaaktype', then retrieves all the 'resultaten' possible for this
 * 'procestype' from the selectielijst API.
 */
export async function listSelectieLijstKlasseChoices(
  params?:
    | URLSearchParams
    | {
        zaak?: Zaak["url"];
      },
) {
  const response = await request(
    "GET",
    "/_selectielijstklasse-choices/",
    params,
  );
  const promise: Promise<Option[]> = response.json();
  return promise;
}

/**
 * Retrieve zaaktypen from Open Zaak and return a value and a label per zaaktype. The label is the 'omschrijving' field
 * an the value is the URL. The response is cached for 15 minutes.
 */
export async function listZaaktypeChoices() {
  return cacheMemo("listZaaktypeChoices", async () => {
    const response = await request("GET", "/_zaaktypen-choices/");
    const promise: Promise<ZaaktypeChoice[]> = response.json();
    return promise;
  });
}

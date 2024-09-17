import { Option } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { cacheMemo } from "../cache/cache";
import { User } from "./auth";
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
) {
  let params;
  if (reviewPk) {
    params = { review: reviewPk };
  } else if (destructionListUuid) {
    params = { destructionList: destructionListUuid };
  } else {
    params = undefined;
  }

  const response = await request("GET", "/_zaaktypen-choices/", params);
  const promise: Promise<ZaaktypeChoice[]> = response.json();
  return promise;
}

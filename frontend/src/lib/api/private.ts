import { Option } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { cacheMemo } from "../cache/cache";
import { params2CacheKey, params2Object } from "../format/params";
import { request } from "./request";

/**
 * Retrieve informatieobjecttypen from Open Zaak and return a value and a label per informatieobjecttype. The label is
 * the field 'omschrijving'.
 */
export async function listInformatieObjectTypeChoices(
  zaaktypeUrl?: string,
  signal?: AbortSignal,
) {
  return cacheMemo(
    "listInformatieObjectTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/_informatieobjecttype-choices/",
        {
          zaaktype: zaaktypeUrl,
        },
        undefined,
        undefined,
        signal,
      );
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
export async function listStatusTypeChoices(
  zaaktypeUrl?: string,
  signal?: AbortSignal,
) {
  return cacheMemo(
    "listStatusTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/_statustype-choices/",
        {
          zaaktype: zaaktypeUrl,
        },
        undefined,
        undefined,
        signal,
      );
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
export async function listResultaatTypeChoices(
  zaaktypeUrl?: string,
  signal?: AbortSignal,
) {
  return cacheMemo(
    "listResultaatTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/_external-resultaattype-choices/",
        {
          zaaktype: zaaktypeUrl,
        },
        undefined,
        undefined,
        signal,
      );
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
  signal?: AbortSignal,
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
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    zaak ? [zaak] : undefined,
  );
}

/**
 * Retrieve zaaktypen from Open Zaak and return a value and a label per zaaktype.
 * The label is the 'omschrijving' field, and the value is the URL. The response is cached for 15 minutes.
 * @param [params] - Additional search parameters for filtering (this keeps filters in sync with objects on page).
 * @param [external=false] - Fetch zaaktypen from ZRC Service (Open Zaak) (slower/can't be combined with other filtering options).
 * @param signal - Abort signal, should be called in cleanup function in React `useEffect()` hooks.
 * @returns {Promise<Option[]>} A promise resolving to an array of options with `value` and `label`.
 */
export async function listZaaktypeChoices(
  params?:
    | URLSearchParams
    | {
        inReview: string;
        inDestructionList: string;
        notInDestructionList: boolean;
      },
  external = false,
  signal?: AbortSignal,
) {
  const cacheParams = params2CacheKey(params || {});

  return cacheMemo(
    "listZaaktypeChoices",
    async () => {
      const data = params2Object(params || {});
      let response;

      if (external) {
        response = await request(
          "GET",
          "/_external-zaaktypen-choices/",
          data,
          undefined,
          undefined,
          signal,
        );
      } else {
        response = await request(
          "POST",
          "/_zaaktypen-choices/",
          {},
          data,
          undefined,
          signal,
        );
      }

      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    external ? [cacheParams, "external"] : [cacheParams],
  );
}

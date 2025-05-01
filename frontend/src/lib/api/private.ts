import { Option } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { cacheMemo } from "../cache/cache";
import { params2CacheKey, params2Object } from "../format/params";
import { request } from "./request";

/**
 * Retrieve the behandelend afdelingen the zaken in the database. These are rollen
 * with betrokkeneType equal to "organisatorische_eenheid".
 * @param params
 * @param signal
 */
export async function listBehandelendAfdelingChoices(
  params?: URLSearchParams | Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<Option[]> {
  const cacheParams = params2CacheKey(params || {});
  return cacheMemo(
    "listBehandelendAfdelingChoices",
    async () => {
      const response = await request(
        "GET",
        "/_retrieve-behandelend-afdeling-choices-choices/",
        params || {},
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [cacheParams],
  );
}

/**
 * Retrieve informatieobjecttypen from Open Zaak and return a value and a label per informatieobjecttype. The label is
 * the field 'omschrijving'.
 */
export async function listInformatieObjectTypeChoices(
  zaaktypeIdentificatie?: string,
  signal?: AbortSignal,
) {
  return cacheMemo(
    "listInformatieObjectTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/_informatieobjecttype-choices/",
        {
          zaaktypeIdentificatie: zaaktypeIdentificatie,
        },
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [zaaktypeIdentificatie],
  );
}

/**
 * Retrieve statustypen from Open Zaak and return a value and a label per statustype. The label is the field
 * 'omschrijving'.
 */
export async function listStatusTypeChoices(
  zaaktypeIdentificatie?: string,
  signal?: AbortSignal,
) {
  return cacheMemo(
    "listStatusTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/_statustype-choices/",
        {
          zaaktypeIdentificatie: zaaktypeIdentificatie,
        },
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [zaaktypeIdentificatie],
  );
}

/**
 * Retrieve resultaattypen from Open Zaak and return a value and a label per
 * resultaattype. The label is the field 'omschrijving'.
 */
export async function listResultaatTypeChoices(
  params: {
    zaaktypeIdentificatie: string;
  },
  external: true,
  signal?: AbortSignal,
): Promise<Option[]>;
export async function listResultaatTypeChoices(
  params?: URLSearchParams | Record<string, string | number | undefined>,
  external?: false,
  signal?: AbortSignal,
): Promise<Option[]>;
export async function listResultaatTypeChoices(
  params?:
    | {
        zaaktypeIdentificatie: string;
      }
    | URLSearchParams
    | Record<string, string | number | undefined>,
  external: boolean = false,
  signal?: AbortSignal,
): Promise<Option[]> {
  return cacheMemo(
    "listResultaatTypeChoices",
    async () => {
      const endpoint = external
        ? "/_external-resultaattype-choices/"
        : "/_internal-resultaattype-choices/";
      const response = await request(
        "GET",
        endpoint,
        params || {},
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [JSON.stringify(params)],
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
  external = false,
  signal?: AbortSignal,
) {
  const cacheParams = params2CacheKey(params || {});
  return cacheMemo(
    "listSelectielijstKlasseChoices",
    async () => {
      const endpoint = external
        ? "/_selectielijstklasse-choices/"
        : "/_internal-selectielijstklasse-choices/";
      const response = await request(
        "GET",
        endpoint,
        params,
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    external ? [cacheParams, "external"] : [cacheParams],
  );
}

/**
 * Retrieve zaaktypen from Open Zaak and return a value and a label per zaaktype.
 * The label is the 'omschrijving' field, and the value is the identificatie. The response may be cached.
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

export async function clearChoicesCache() {
  return await request(
    "POST",
    "/_clear-choices-endpoints-cache/",
    {},
    undefined,
    undefined,
  );
}

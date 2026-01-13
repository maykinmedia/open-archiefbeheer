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
export async function listDestructionReportInformatieObjectTypeChoices(
  zaaktype?: string,
  signal?: AbortSignal,
) {
  return cacheMemo(
    "listDestructionReportInformatieObjectTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/destructionreport-informatieobjecttype-choices/",
        {
          zaaktype: zaaktype,
        },
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [zaaktype],
  );
}

/**
 * Retrieve statustypen from Open Zaak and return a value and a label per statustype. The label is the field
 * 'omschrijving'.
 */
export async function listDestructionReportStatusTypeChoices(
  zaaktype?: string,
  signal?: AbortSignal,
) {
  return cacheMemo(
    "listDestructionReportStatusTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/destructionreport-statustype-choices/",
        {
          zaaktype: zaaktype,
        },
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [zaaktype],
  );
}

export async function listDestructionReportResultaatTypeChoices(
  zaaktype?: string,
  signal?: AbortSignal,
) {
  return cacheMemo(
    "listDestructionReportResultaatTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/destructionreport-resultaattype-choices/",
        {
          zaaktype: zaaktype,
        },
        undefined,
        undefined,
        signal,
      );
      const promise: Promise<Option[]> = response.json();

      return promise;
    },
    [zaaktype],
  );
}

/**
 * Retrieve resultaattypen from Open Zaak and return a value and a label per
 * resultaattype. The label is the field 'omschrijving'.
 */
export async function listResultaatTypeChoices(
  params?: URLSearchParams | Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<Option[]>;
export async function listResultaatTypeChoices(
  params?:
    | {
        zaaktypeIdentificatie: string;
      }
    | URLSearchParams
    | Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<Option[]> {
  return cacheMemo(
    "listResultaatTypeChoices",
    async () => {
      const response = await request(
        "GET",
        "/_internal-resultaattype-choices/",
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
 * Retrieve the zaaktypen that can be used to configure the short archiving process.
 * The label is the 'omschrijving' field, and the value is the identificatie, because the identificatie is the same across versions.
 * The response may be cached.
 * @param signal - Abort signal, should be called in cleanup function in React `useEffect()` hooks.
 * @returns {Promise<Option[]>} A promise resolving to an array of options with `value` and `label`.
 */
export async function listShortProcessZaaktypeChoices(signal?: AbortSignal) {
  return cacheMemo("listShortProcessZaaktypeChoices", async () => {
    const response = await request(
      "GET",
      "/shortprocess-zaaktypen-choices/",
      undefined,
      undefined,
      undefined,
      signal,
    );
    const promise: Promise<Option[]> = response.json();
    return promise;
  });
}

/**
 * Retrieve the zaaktypen that can be used to configure the destruction report.
 * The label is the 'omschrijving' field with the 'beginGeldigheid' and the value is the URL of the zaaktype.
 * The response may be cached.
 * @param signal - Abort signal, should be called in cleanup function in React `useEffect()` hooks.
 * @returns {Promise<Option[]>} A promise resolving to an array of options with `value` and `label`.
 */
export async function listDestructionReportZaaktypeChoices(
  signal?: AbortSignal,
) {
  return cacheMemo("listDestructionReportZaaktypeChoices", async () => {
    const response = await request(
      "GET",
      "/destructionreport-zaaktypen-choices/",
      undefined,
      undefined,
      undefined,
      signal,
    );
    const promise: Promise<Option[]> = response.json();
    return promise;
  });
}

/**
 * Retrieve the "internal" zaaktypen, i.e - the zaaktypen of the zaken in the backend of OAB.
 * The label is the 'omschrijving' field, and the value is the identificatie. The response may be cached.
 * @param [params] - Additional search parameters for filtering (this keeps filters in sync with objects on page).
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
  signal?: AbortSignal,
) {
  const cacheParams = params2CacheKey(params || {});

  return cacheMemo(
    "listZaaktypeChoices",
    async () => {
      const data = params2Object(params || {});
      const response = await request(
        "POST",
        "/_zaaktypen-choices/",
        {},
        data,
        undefined,
        signal,
      );

      const promise: Promise<Option[]> = response.json();
      return promise;
    },
    [cacheParams],
  );
}

export async function clearBackendCache() {
  return await request(
    "POST",
    "/_clear-default-cache/",
    {},
    undefined,
    undefined,
  );
}

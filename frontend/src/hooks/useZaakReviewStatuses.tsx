import { useMemo } from "react";

import {
  SessionStorageBackend,
  ZaakSelectionBackend,
} from "../lib/zaakSelection";
import { Zaak } from "../types";
import { useZaakSelection } from "./useZaakSelection";

export type ZAAK_REVIEW_STATUS_ENUM = boolean | null;

/**
 * Returns `object` indicating whether each zaak in `zakenOnPage` is approved (`boolean`) or not reviewed (`null`).
 * @param storageKey
 * @param zakenOnPage
 * @param selectionBackend
 */
export function useZaakReviewStatuses(
  storageKey: string,
  zakenOnPage: Zaak[],
  selectionBackend: ZaakSelectionBackend = SessionStorageBackend,
): Record<string, ZAAK_REVIEW_STATUS_ENUM> {
  const [, , { zaakSelectionOnPage }] = useZaakSelection<{ approved: boolean }>(
    storageKey,
    zakenOnPage,
    undefined,
    undefined,
    selectionBackend,
  );

  // Page specific approved zaken.
  const approvedZaakUrlsOnPage = useMemo(() => {
    return Object.entries(zaakSelectionOnPage)
      .filter(([, { detail }]) => detail?.approved === true)
      .map(([url]) => url);
  }, [zaakSelectionOnPage]);

  // Page specific excluded zaken.
  const excludedZaakSelectionOnPage = useMemo(
    () =>
      Object.entries(zaakSelectionOnPage)
        .filter(([, { detail }]) => detail?.approved === false)
        .map(([url]) => url),
    [zaakSelectionOnPage],
  );

  // Find status of zaak.
  return useMemo(() => {
    const entries: [string, ZAAK_REVIEW_STATUS_ENUM][] = zakenOnPage.map(
      (zaak) => {
        // Approved.
        if (approvedZaakUrlsOnPage.includes(zaak.url as string)) {
          return [zaak.url as string, true];
        }

        // Excluded
        if (excludedZaakSelectionOnPage.includes(zaak.url as string)) {
          return [zaak.url as string, false];
        }

        // Not selected.
        return [zaak.url as string, null];
      },
    );

    // Construct object.
    return Object.fromEntries(entries);
  }, [zakenOnPage, approvedZaakUrlsOnPage, excludedZaakSelectionOnPage]);
}

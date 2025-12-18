import { useMemo } from "react";

import { ZaakIdentifier, ZaakSelection } from "../lib/zaakSelection";

export type ZAAK_REVIEW_STATUS_ENUM = boolean | null;

/**
 * Returns `object` indicating whether each zaak in `zakenOnPage` is approved (`boolean`) or not reviewed (`null`).
 * @param zakenOnPage
 * @param reviewedZaakSelectionOnPage
 */
export function useZaakReviewStatuses(
  zakenOnPage: ZaakIdentifier[],
  reviewedZaakSelectionOnPage: ZaakSelection<{ approved?: boolean }>,
): Record<string, ZAAK_REVIEW_STATUS_ENUM> {
  // Page specific approved zaken.
  const approvedZaakUrlsOnPage = useMemo(() => {
    return Object.entries(reviewedZaakSelectionOnPage)
      .filter(([, { detail }]) => detail?.approved === true)
      .map(([url]) => url);
  }, [reviewedZaakSelectionOnPage]);

  // Page specific excluded zaken.
  const excludedZaakSelectionOnPage = useMemo(
    () =>
      Object.entries(reviewedZaakSelectionOnPage)
        .filter(([, { detail }]) => detail?.approved === false)
        .map(([url]) => url),
    [reviewedZaakSelectionOnPage],
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

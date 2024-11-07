import { Badge, Solid } from "@maykin-ui/admin-ui";
import React, { useMemo } from "react";

import { ZaakSelection } from "../lib/zaakSelection";
import { Zaak } from "../types";
import {
  ZAAK_REVIEW_STATUS_ENUM,
  useZaakReviewStatuses,
} from "./useZaakReviewStatuses";

/**
 * Returns `object` with appropriate Badge element and `ZAAK_REVIEW_STATUS_ENUM` for each zaak in `zakenOnPage`.
 * @param zakenOnPage
 * @param reviewedZaakSelectionOnPage
 */
export function useZaakReviewStatusBadges(
  zakenOnPage: Zaak[],
  reviewedZaakSelectionOnPage: ZaakSelection<{ approved: boolean }>,
): Record<string, { badge: React.ReactNode; status: ZAAK_REVIEW_STATUS_ENUM }> {
  const statuses = useZaakReviewStatuses(
    zakenOnPage,
    reviewedZaakSelectionOnPage,
  );
  return useMemo(() => {
    const badges = zakenOnPage.map((z) => {
      const status = statuses[z.url as string];

      if (typeof status === "boolean") {
        if (status) {
          return (
            // @ts-expect-error - style props not supported (yet?)
            <Badge key={z.uuid} level="success" style={{ display: "block" }}>
              <Solid.HandThumbUpIcon /> Geaccordeerd
            </Badge>
          );
        } else {
          return (
            // @ts-expect-error - style props not supported (yet?)
            <Badge key={z.uuid} level="danger" style={{ display: "block" }}>
              <Solid.HandThumbDownIcon />
              Uitgezonderd
            </Badge>
          );
        }
      } else {
        return (
          // @ts-expect-error - style props not supported (yet?)
          <Badge key={z.uuid} style={{ display: "block" }}>
            <Solid.QuestionMarkCircleIcon />
            Niet beoordeeld
          </Badge>
        );
      }
    });

    const entries = zakenOnPage.map((z, i) => [
      z.url as string,
      { badge: badges[i], status: statuses[z.url as string] },
    ]);
    return Object.fromEntries(entries);
  }, [statuses]);
}

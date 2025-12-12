import { invariant } from "@maykin-ui/client-common";

import { Zaak } from "../../types";
import { PaginatedDestructionListItems } from "../api/destructionListsItem";
import { PaginatedResults } from "../api/paginatedResults";

export type DestructionDetailData = Zaak & { processingStatus?: string };

/**
 * Transforms a PaginatedDestructionListItems object into a PaginatedResults object
 * containing DestructionDetailData entries. Filters out items without a valid `zaak`
 * and maps the remaining items to include `zaak` data along with its associated
 * `processingStatus`.
 */
export function paginatedDestructionListItems2paginatedDetail(
  paginatedDestructionListItems: PaginatedDestructionListItems,
): PaginatedResults<DestructionDetailData> {
  return {
    ...paginatedDestructionListItems,
    results: paginatedDestructionListItems.results
      .filter((dli) => Boolean(dli.zaak))
      .map((dli) => {
        const zaak = dli.zaak;
        invariant(zaak, "zaak must be a valid Zaak!");

        return {
          ...zaak,
          processingStatus: dli.processingStatus,
        };
      }),
  };
}

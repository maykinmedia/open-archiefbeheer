import { PaginatedDestructionListItems } from "../api/destructionListsItem";
import { PaginatedZaken } from "../api/zaken";

/**
 * Converts `PaginatedDestructionListItems` to `PaginatedZaken`.
 */
export function paginatedDestructionListItems2paginatedZaken(
  paginatedDestructionListItems: PaginatedDestructionListItems,
): PaginatedZaken {
  return {
    ...paginatedDestructionListItems,
    results: paginatedDestructionListItems.results
      .map((dli) => ({ ...dli.zaak, processingStatus: dli.processingStatus }))
      // @ts-expect-error - FIXME: Adding "processingStatus" to zaak.
      .filter((v): v is Zaak => Boolean(v)) as Zaak[],
  };
}

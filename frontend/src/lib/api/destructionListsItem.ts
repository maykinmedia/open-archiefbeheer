import { Zaak } from "../../types";
import { PaginatedResults } from "./paginatedResults";
import { ProcessingStatus } from "./processingStatus";
import { request } from "./request";

export type DestructionListItem = {
  pk: number;
  status?: DestructionListItemStatus;
  extraZaakData?: Record<string, unknown> | null;
  zaak: Zaak | null;
  processingStatus?: ProcessingStatus;
};

export type DestructionListItemStatus = "removed" | "suggested";

export type PaginatedDestructionListItems =
  PaginatedResults<DestructionListItem>;

/**
 * List destruction lists.
 */
export async function listDestructionListItems(
  destructionListUuid: string,
  params?:
    | URLSearchParams
    | {
        page?: number;
        page_size?: number;
        processing_status?: ProcessingStatus;
        status: DestructionListItemStatus; // TODO ?
      },
) {
  const response = await request("GET", "/destruction-list-items/", {
    destruction_list: destructionListUuid,
    status: "suggested",
    ...params,
  } as typeof params & { destruction_list: string });
  const promise: Promise<PaginatedDestructionListItems> = response.json();
  return promise;
}

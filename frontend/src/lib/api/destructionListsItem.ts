import { Zaak } from "../../types";
import { PaginatedResults } from "./paginatedResults";
import { ProcessingStatus } from "./processingStatus";
import { request } from "./request";

export type DestructionListItem = {
  pk: number;
  status?: DestructionListItemStatus;
  zaak: Zaak | null;
  processingStatus: ProcessingStatus;
  plannedDestructionDate: string | null;
  reviewAdviceIgnored: boolean | null;
  reviewResponseComment: string;
  selectedRelatedObjectsCount: number;
  supportedRelatedObjectsCount: number;
};

export interface ZaakItem extends Zaak {
  processingStatus?: ProcessingStatus;
}

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
        "item-processing_status"?: ProcessingStatus;
        "item-status"?: DestructionListItemStatus;
        "item-order_review_ignored"?: string | boolean;
      },
  signal?: AbortSignal,
) {
  if (params && !(params instanceof URLSearchParams)) {
    if (typeof params["item-order_review_ignored"] === "boolean") {
      params["item-order_review_ignored"] = String(
        params["item-order_review_ignored"],
      );
    }
  }

  // Use the params object directly in the request
  const response = await request(
    "GET",
    "/destruction-list-items/",
    {
      "item-destruction_list": destructionListUuid,
      "item-status": "suggested",
      ...((params as Record<string, string>) || {}),
    },
    undefined,
    undefined,
    signal,
  );

  const promise: Promise<PaginatedDestructionListItems> = response.json();
  return promise;
}

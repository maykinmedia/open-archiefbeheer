import { isPrimitive } from "@maykin-ui/admin-ui";
import { URLSearchParams } from "url";

import { Zaak } from "../../types";
import { User } from "./auth";
import { ProcessingStatus } from "./processingStatus";
import { request } from "./request";

export type DestructionList = {
  pk: number;
  assignee: User;
  assignees: DestructionListAssignee[];
  author: User;
  comment: string;
  containsSensitiveInfo: boolean;
  created: string;
  plannedDestructionDate: string | null;
  name: string;
  status: DestructionListStatus;
  processingStatus: ProcessingStatus;
  statusChanged: string | null;
  deletableItemsCount: number;
  uuid: string;
};

export type DestructionListAssignee = {
  user: User;
  role?: "main_reviewer" | "co_reviewer" | "author" | "archivist";
};

// An array to be used in various parts of the application.
export const DESTRUCTION_LIST_STATUSES = [
  "new",
  "changes_requested",
  "ready_to_review",
  "internally_reviewed",
  "ready_for_archivist",
  "ready_to_delete",
  "deleted",
] as const;

// Inferring the type of the array, so that we don't have to repeat the same.
export type DestructionListStatus = (typeof DESTRUCTION_LIST_STATUSES)[number];

export type DestructionListUpdateData = {
  assignees?: DestructionListAssigneeUpdate[];
  add?: DestructionListItemUpdate[];
  remove?: DestructionListItemUpdate[];
  comment?: string;
};

export type DestructionListAssigneeUpdate = {
  user: number;
};

export type DestructionListItemUpdate = {
  status?: string;
  zaak: string;
};

export type DestructionListMarkAsFinalData = {
  user: number;
  comment?: string;
};

/**
 * Create a new destruction list.
 * @param name
 * @param zaken
 * @param assigneeId
 * @param zaakFilters FIXME: Must be a JSON object containing the filter data.
 * @param allZakenSelected
 * @param comment
 * @param signal
 */
export async function createDestructionList(
  name: string,
  zaken: string[] | Zaak[],
  assigneeId: string,
  zaakFilters: string,
  allZakenSelected: boolean,
  comment?: string,
  signal?: AbortSignal,
) {
  const urls = zaken.map((zaak) => (isPrimitive(zaak) ? zaak : zaak.url));

  const destructionList = {
    name,
    reviewer: { user: JSON.parse(assigneeId) },
    add: urls.map((url) => ({ zaak: url })),
    selectAll: allZakenSelected,
    zaakFilters: JSON.parse(zaakFilters),
    comment,
  };

  const response = await request(
    "POST",
    "/destruction-lists/",
    {},
    destructionList,
    undefined,
    signal,
  );
  const promise: Promise<DestructionList> = response.json();
  return promise;
}

/**
 * Get destruction list.
 * @param uuid
 */
export async function getDestructionList(uuid: string) {
  const response = await request("GET", `/destruction-lists/${uuid}/`);
  const promise: Promise<DestructionList> = response.json();
  return promise;
}

/**
 * List destruction lists.
 */
export async function listDestructionLists(
  params?:
    | URLSearchParams
    | {
        name: string;
        status: DestructionListStatus;
        author: number;
        reviewer: number;
        assignee: number;
        ordering?: string;
      },
) {
  const response = await request("GET", "/destruction-lists/", params);
  const promise: Promise<DestructionList[]> = response.json();
  return promise;
}

/**
 * Delete a destruction list.
 * @param uuid
 * @returns
 */
export async function deleteDestructionList(uuid: string) {
  const response = await request("DELETE", `/destruction-lists/${uuid}/`, {});
  if (response.status === 204) {
    return null;
  }
  const promise: Promise<unknown> = response.json();
  return promise;
}

/**
 * Update destruction list.
 * @param uuid
 * @param data
 */
export async function updateDestructionList(
  uuid: string,
  data: DestructionListUpdateData,
) {
  const response = await request(
    "PATCH",
    `/destruction-lists/${uuid}/`,
    {},
    data,
  );
  const promise: Promise<DestructionList[]> = response.json();
  return promise;
}

/**
 * Mark destruction list as ready to review.
 * @param uuid
 */
export async function markDestructionListAsReadyToReview(uuid: string) {
  const response = await request(
    "POST",
    `/destruction-lists/${uuid}/mark_ready_review/`,
  );
  // Check if the response is a 201 Created status code.
  if (response.status === 201) {
    return null;
  }
  const promise: Promise<DestructionList> = response.json();
  return promise;
}

/**
 * Mark destruction list as final.
 * @param uuid
 * @param data
 * @returns
 */
export async function markDestructionListAsFinal(
  uuid: string,
  data: DestructionListMarkAsFinalData,
) {
  const response = await request(
    "POST",
    `/destruction-lists/${uuid}/make_final/`,
    {},
    data,
  );
  // Check if the response is a 201 Created status code.
  if (response.status === 201) {
    return null;
  }
  const promise: Promise<DestructionList> = response.json();
  return promise;
}

/**
 * Queue a background process that will delete the cases in the list from the case system.
 * @param uuid
 * @returns
 */
export async function destructionListQueueDestruction(uuid: string) {
  await request(
    "POST",
    `/destruction-lists/${uuid}/queue_destruction/`,
    {},
    { uuid },
  );
  return null;
}

export type DestructionListReassignData = {
  comment: string;
  assignee: DestructionListAssigneeUpdate;
};

/**
 * Update destruction list.
 * @param uuid
 * @param data
 */
export async function reassignDestructionList(
  uuid: string,
  data: DestructionListReassignData,
) {
  return request("POST", `/destruction-lists/${uuid}/reassign/`, {}, data);
}

/**
 * List all the co-reviewers assigned to a destruction list.
 * @param uuid
 * @param signal
 */
export async function listDestructionListCoReviewers(
  uuid: string,
  signal?: AbortSignal,
) {
  const response = await request(
    "GET",
    `/destruction-lists/${uuid}/co-reviewers/`,
    undefined,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<DestructionListAssignee[]> = response.json();
  return promise;
}

export type DestructionListUpdateCoReviewersData = {
  comment: string;
  add: { user: number }[];
};

/**
 * Full update of the co-reviewers assigned to a destruction list.
 * @param uuid
 * @param data
 */
export async function updateCoReviewers(
  uuid: string,
  data: DestructionListUpdateCoReviewersData,
) {
  return request("PUT", `/destruction-lists/${uuid}/co-reviewers/`, {}, data);
}

/**
 * "Aborts" a destruction list:
 * - Sets the status of the destruction list to "new"
 * - Cancels if the destruction list is due to be destroyed.
 * @param uuid
 */
export async function abort(uuid: string, data: { comment: string }) {
  return request("POST", `/destruction-lists/${uuid}/abort/`, {}, data);
}

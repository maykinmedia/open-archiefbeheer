import { isPrimitive } from "@maykin-ui/admin-ui";
import { URLSearchParams } from "url";

import { Zaak } from "../../types";
import { User } from "./auth";
import { ProcessingStatus } from "./processingStatus";
import { request } from "./request";
import { Assignee } from "./reviewers";

export type DestructionList = {
  pk: number;
  assignee: User;
  assignees: DestructionListAssignee[];
  author: User;
  comment: string;
  containsSensitiveInfo: boolean;
  plannedDestructionDate: string | null;
  created: string;
  name: string;
  status: DestructionListStatus;
  processingStatus: ProcessingStatus;
  statusChanged: string | null;
  uuid: string;
};

export type DestructionListAssignee = {
  user: User;
  role?: "main_reviewer" | "co_reviewer" | "author" | "archivist";
};

// An array to be used in various parts of the application.
export const DESTRUCTION_LIST_STATUSES = [
  "new",
  "ready_to_review",
  "changes_requested",
  "ready_to_delete",
  "deleted",
  "ready_for_archivist",
  "internally_reviewed",
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
 * @param zaakFilters
 * @param allZakenSelected
 * @param comment
 */
export async function createDestructionList(
  name: string,
  zaken: string[] | Zaak[],
  assigneeId: string,
  zaakFilters: string,
  allZakenSelected: boolean,
  comment?: string,
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
  params?: URLSearchParams | { ordering?: string },
) {
  const response = await request("GET", "/destruction-lists/", params);
  const promise: Promise<DestructionList[]> = response.json();
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
 * Mark destruction list as ready to reveiw.
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
 * Destroy destruction list
 * @param uuid
 * @returns
 */
export async function destroyDestructionList(uuid: string) {
  const response = await request(
    "DELETE",
    `/destruction-lists/${uuid}/`,
    {},
    { uuid },
  );
  // Check if the response is a 201 Created status code.
  if (response.status === 204) {
    return null;
  }

  const promise: Promise<DestructionList> = response.json();
  return promise;
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
 * @param data
 */
export async function listCoReviewers(uuid: string) {
  const response = await request(
    "GET",
    `/destruction-lists/${uuid}/co-reviewers/`,
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
 * Abort the destruction of a destruction list.
 * @param uuid
 */
export async function abortPlannedDestruction(
  uuid: string,
  data: { comment: string },
) {
  return request(
    "POST",
    `/destruction-lists/${uuid}/abort_destruction/`,
    {},
    data,
  );
}

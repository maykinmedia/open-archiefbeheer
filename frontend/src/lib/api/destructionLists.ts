import { isPrimitive } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { request } from "./request";
import { User } from "./reviewers";

export type DestructionList = {
  assignee: User;
  assignees: DestructionListAssignee[];
  author: User;
  containsSensitiveInfo: boolean;
  created: string;
  items: DestructionListItem[];
  name: string;
  status: "in_progress" | "processing" | "completed";
  statusChanged: string | null;
  uuid: string;
};

export type DestructionListAssignee = {
  user: User;
  order: number;
};

export type DestructionListItem = {
  zaak: Zaak["url"];
  status: string;
  zaakData: Zaak;
};

export type DestructionListUpdateData = {
  assignees?: DestructionListAssigneeUpdate[];
  items?: DestructionListItemUpdate[];
};

export type DestructionListAssigneeUpdate = {
  user: number;
  order: number;
};

export type DestructionListItemUpdate = {
  zaak: string;
  status?: string;
  zaakData?: Zaak;
};

/**
 * Create a new destruction list.
 * @param name
 * @param zaken
 * @param assignees
 */
export async function createDestructionList(
  name: string,
  zaken: string[] | Zaak[],
  assignees: string[] | number[] | User[],
) {
  const urls = zaken.map((zaak) => (isPrimitive(zaak) ? zaak : zaak.url));
  const assigneeIds = assignees.map((assignee) =>
    isPrimitive(assignee) ? assignee.toString() : assignee.pk.toString(),
  );

  const destructionList = {
    name,
    assignees: assigneeIds.map((id) => ({ user: id })),
    items: urls.map((url) => ({ zaak: url })),
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
export async function listDestructionLists() {
  const response = await request("GET", "/destruction-lists/");
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

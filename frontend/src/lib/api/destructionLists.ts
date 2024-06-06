import { isPrimitive } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { request } from "./request";
import { User } from "./reviewers";

export type DestructionList = {
  uuid: string;
  name: string;
  assignees: DestructionListAssignee[];
  items: DestructionListItem[];
  status: "in_progress" | "processing" | "completed";
  created: Date;
  statusChanged?: Date;
};

export type DestructionListAssignee = {
  user: User;
  order: number;
};

export type DestructionListItem = {
  zaak: Zaak["url"];
};

/**
 * List destruction lists.
 */
export async function listDestructionLists() {
  const response = await request("GET", "/destruction-lists/");
  const promise: Promise<DestructionList[]> = response.json();
  return promise;
}

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

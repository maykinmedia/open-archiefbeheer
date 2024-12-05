import { User } from "./auth";
import { DestructionList } from "./destructionLists";
import { request } from "./request";

export type AuditLogUserEntry = {
  pk: User["pk"];
  email: User["email"];
  username: User["username"];
};

export type AuditLogAssignedExtraData = {
  pk: DestructionList["pk"];
  name: DestructionList["name"];
  author: AuditLogUserEntry; // Destruction list author.
  assignees: AuditLogUserEntry[]; // New assignees.
  minArchiefactiedatum?: string;
  maxArchiefactiedatum?: string;
  comment?: string;
  archiefnominaties?: string[];
  userGroups?: string[];
  zaaktypen?: { label: string; value: string }[];
  numberOfZaken?: number;
  resultaten?: {
    label: string;
    value: string;
  }[];
};

export type AuditLogItem = {
  pk: number;
  timestamp: string;
  user: User; // User triggering log entry.
  message: string;
  extraData: AuditLogAssignedExtraData;
};

/**
 * Retrieve the audit log for this destruction list.
 * @param uuid
 * @param event
 */
export async function listAuditLog(uuid: string, event?: string) {
  const response = await request("GET", "/logs/", {
    destruction_list: uuid,
    ...(event && { event }),
  });
  const promise: AuditLogItem[] = await response.json();
  return promise;
}

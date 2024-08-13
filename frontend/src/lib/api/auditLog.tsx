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
};

export type AuditLogItem = {
  pk: number;
  timestamp: string;
  user: User["pk"]; // User triggering log entry.
  message: string;
  extraData: AuditLogAssignedExtraData | unknown;
};

/**
 * Retrieve the audit log for this destruction list.
 * @param uuid
 */
export async function listAuditLog(uuid: string) {
  const response = await request("GET", `/destruction-lists/${uuid}/auditlog/`);
  const promise: AuditLogItem[] = await response.json();
  return promise;
}

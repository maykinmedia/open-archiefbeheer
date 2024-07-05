import { User } from "./auth";
import { request } from "./request";

export type Archivists = {
  user: User;
  order: number;
};

/**
 * List all the users that have the permission to archive destruction lists.
 */
export async function listArchivists() {
  const response = await request("GET", "/archivists/");
  const promise: Promise<User[]> = response.json();
  return promise;
}

import { User } from "./auth";
import { request } from "./request";

export type Archivist = {
  user: User;
  order: number;
};

/**
 * List all the users that have the permission to archive destruction lists.
 */
export async function listArchivists(signal?: AbortSignal) {
  const response = await request(
    "GET",
    "/users",
    { role: "archivist" },
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<User[]> = response.json();
  return promise;
}

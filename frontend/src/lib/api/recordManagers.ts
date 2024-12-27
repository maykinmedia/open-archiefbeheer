import { cacheMemo } from "../cache/cache";
import { User } from "./auth";
import { request } from "./request";

/**
 * List all the users that have the permission to review destruction lists.
 */
export async function listRecordManagers() {
  return cacheMemo("listRecordManagers", async () => {
    const response = await request("GET", "/users", { role: "record_manager" });
    const promise: Promise<User[]> = response.json();
    return promise;
  });
}

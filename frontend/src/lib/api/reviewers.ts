import { cacheMemo } from "../cache/cache";
import { User } from "./auth";
import { request } from "./request";

/**
 * List all the users that have the permission to review destruction lists.
 */
export async function listReviewers() {
  return cacheMemo("listReviewers", async () => {
    const response = await request("GET", "/users", { role: "main_reviewer" });
    const promise: Promise<User[]> = response.json();
    return promise;
  });
}

/**
 * List all the users that have the permission to review destruction lists.
 */
export async function listCoReviewers() {
  return cacheMemo("listCoReviewers", async () => {
    const response = await request("GET", "/users", { role: "co_reviewer" });
    const promise: Promise<User[]> = response.json();
    return promise;
  });
}

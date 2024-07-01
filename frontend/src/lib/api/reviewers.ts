import { cacheMemo } from "../cache/cache";
import { User } from "./auth";
import { request } from "./request";

export type Assignee = {
  user: User;
  order: number;
};

/**
 * List all the users that have the permission to review destruction lists.
 */
export async function listReviewers() {
  return cacheMemo("listReviewers", async () => {
    const response = await request("GET", "/reviewers/");
    const promise: Promise<User[]> = response.json();
    return promise;
  });
}

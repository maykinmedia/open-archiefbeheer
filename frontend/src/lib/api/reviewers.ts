import { cacheMemo } from "../cache/cache";
import { User } from "./auth";
import { request } from "./request";

/**
 * List all the users that have the permission to review destruction lists.
 */
export async function listReviewers(signal?: AbortSignal) {
  return cacheMemo("listReviewers", async () => {
    const response = await request(
      "GET",
      "/users",
      { role: "main_reviewer" },
      undefined,
      undefined,
      signal,
    );
    const promise: Promise<User[]> = response.json();
    return promise;
  });
}

/**
 * List all the users that have the permission to review destruction lists.
 */
export async function listCoReviewers(signal?: AbortSignal, cache = true) {
  const fn = async () => {
    const response = await request(
      "GET",
      "/users/",
      { role: "co_reviewer" },
      undefined,
      undefined,
      signal,
    );
    const promise: Promise<User[]> = response.json();
    return promise;
  };
  return cache ? cacheMemo("listCoReviewers", fn) : fn();
}

import { cacheDelete, cacheMemo } from "../cache/cache";
import { request } from "./request";

export type User = {
  pk: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};

export type Role = {
  name: string;
  canStartDestruction: boolean;
  canReviewDestruction: boolean;
  canReviewFinalList: boolean;
  canViewCaseDetails: boolean;
};

/**
 * API call for login.
 * @param username
 * @param password
 */
export async function login(username: string, password: string) {
  return request("POST", "/auth/login/", undefined, {
    username,
    password,
  });
}

/**
 * API call for logout.
 */
export async function logout() {
  await cacheDelete("whoAmI");
  return request("POST", "/auth/logout/");
}

/**
 * API call to get the current logged-in user.
 */
export async function whoAmI() {
  return cacheMemo<User>("whoAmI", async () => {
    const response = await request("GET", "/whoami/");
    const promise: Promise<User> = response.json();
    return promise;
  });
}

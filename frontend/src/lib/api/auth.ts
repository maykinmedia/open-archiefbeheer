import { OidcConfigContextType } from "../../contexts/OidcConfigContext";
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
  canStartDestruction: boolean;
  canReviewDestruction: boolean;
  canCoReviewDestruction: boolean;
  canReviewFinalList: boolean;
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
  return cacheMemo("whoAmI", async () => {
    const response = await request("GET", "/whoami/");
    const promise: Promise<User> = response.json();
    return promise;
  });
}

/**
 * API call to get info about OIDC.
 */
export async function getOIDCInfo() {
  return cacheMemo("getOIDCInfo", async () => {
    const response = await request("GET", "/oidc-info");
    const promise: Promise<OidcConfigContextType> = response.json();
    return promise;
  });
}

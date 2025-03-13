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
 * @param signal
 */
export async function login(
  username: string,
  password: string,
  signal?: AbortSignal,
) {
  return request(
    "POST",
    "/auth/login/",
    undefined,
    {
      username,
      password,
    },
    undefined,
    signal,
  );
}

/**
 * API call for logout.
 */
export async function logout(signal?: AbortSignal) {
  await cacheDelete("whoAmI");
  return request(
    "POST",
    "/auth/logout/",
    undefined,
    undefined,
    undefined,
    signal,
  );
}

/**
 * API call to get the current logged-in user.
 */
export async function whoAmI(signal?: AbortSignal) {
  return cacheMemo("whoAmI", async () => {
    const response = await request(
      "GET",
      "/whoami/",
      undefined,
      undefined,
      undefined,
      signal,
    );
    const promise: Promise<User> = response.json();
    return promise;
  });
}

/**
 * API call to get info about OIDC.
 */
export async function getOIDCInfo(signal?: AbortSignal) {
  return cacheMemo("getOIDCInfo", async () => {
    const response = await request(
      "GET",
      "/oidc-info",
      undefined,
      undefined,
      undefined,
      signal,
    );
    const promise: Promise<OidcConfigContextType> = response.json();
    return promise;
  });
}

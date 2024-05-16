import { request } from "./request";

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
  return request("POST", "/auth/logout/");
}

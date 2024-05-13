import { request } from "./request";

/**
 * API call for authentication.
 * @param username
 * @param password
 */
export async function login(username: string, password: string) {
  return request("POST", "/auth/login/", {
    username,
    password,
  });
}

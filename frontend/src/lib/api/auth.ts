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
  canViewCaseDetails: boolean;
};

/**
 * API call to get the current logged in user.
 *
 * @returns {Promise<User>}
 */
export async function whoAmI(): Promise<User> {
  const response = await request("GET", "/whoami/");
  return response.json();
}

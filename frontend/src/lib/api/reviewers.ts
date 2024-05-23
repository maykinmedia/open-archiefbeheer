import { request } from "./request";

export type User = {
  pk: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};

export type Assignee = {
  user: User;
  order: number;
};

export type Role = {
  name: string;
  canStartDestruction: boolean;
  canReviewDestruction: boolean;
  canViewCaseDetails: boolean;
};

/**
 * List all the users that have the permission to review destruction lists.
 */
export async function listReviewers() {
  const response = await request("GET", "/reviewers/");
  const promise: Promise<User[]> = response.json();
  return promise;
}

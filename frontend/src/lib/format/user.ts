import { User } from "../api/auth";

/**
 * Returns the correct format for a user.
 * @param user
 * @param showUsername
 * @param showRole
 */
export function formatUser(user: User, { showUsername = true } = {}) {
  let displayName = "";
  if (!user) return displayName;

  if (!user.firstName && !user.lastName) return user.username;

  if (user.firstName) displayName = displayName.concat(user.firstName, " ");
  if (user.lastName) displayName = displayName.concat(user.lastName, " ");
  if (showUsername) displayName = displayName.concat(`(${user.username})`);

  return displayName.trim();
}

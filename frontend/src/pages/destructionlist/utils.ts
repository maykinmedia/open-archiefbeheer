import { User } from "../../lib/api/auth";

/**
 * Returns the correct format for a user.
 * @param user
 * @param showRole
 */
export function formatUser(user: User, showRole = false) {
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName} (${user.username})`
      : user.username;

  if (showRole && user.role.name) {
    return `${displayName} (${user.role.name})`;
  }
  return displayName;
}

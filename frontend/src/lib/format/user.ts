import { User } from "../api/auth";

/**
 * Returns the correct format for a user.
 * @param user
 * @param showUsername
 * @param showRole
 */
export function formatUser(
  user: User,
  { showUsername = true, showRole = false } = {},
) {
  const userNameSuffix = showUsername ? ` (${user.username})` : "";
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}${userNameSuffix}`
      : user.username;

  if (showRole && user.role.name) {
    return `${displayName} (${user.role.name})`;
  }
  return displayName;
}

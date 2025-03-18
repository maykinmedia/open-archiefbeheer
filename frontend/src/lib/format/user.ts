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

  if (user.firstName)
    displayName = displayName.concat(user.firstName.trim(), " ");
  if (user.lastName)
    displayName = displayName.concat(user.lastName.trim(), " ");
  if (showUsername)
    displayName = displayName.concat(`(${user.username.trim()})`);

  return displayName.trim();
}

export function formatGroups(groups?: string[]) {
  if (!groups || groups.length === 0) return "-";

  return groups.join(", ");
}

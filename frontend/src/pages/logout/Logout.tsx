import { redirect } from "react-router-dom";

import { logout } from "../../lib/api/auth";
import { USER_SESSION_KEY } from "../../lib/hooks/useUser";

/**
 * React Router loader.
 * @param request
 */
export const logoutLoader = async () => {
  await logout();
  sessionStorage.removeItem(USER_SESSION_KEY);
  return redirect("/login");
};

import { redirect } from "react-router-dom";

import { logout } from "../../lib/api/auth";

/**
 * React Router loader.
 * @param request
 */
export const logoutLoader = async () => {
  await logout();
  return redirect("/login");
};

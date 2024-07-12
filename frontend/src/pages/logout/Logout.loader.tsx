import { redirect } from "react-router-dom";

import { logout } from "../../lib/api/auth";

/**
 * React Router loader.
 */
export const logoutLoader = async () => {
  await logout();
  return redirect("/login");
};

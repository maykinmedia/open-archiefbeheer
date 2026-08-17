import { redirect } from "react-router";

import { logout } from "../../lib/api/auth";

/**
 * React Router loader.
 */
export const logoutLoader = async () => {
  const abortController = new AbortController();
  await logout(abortController.signal);
  return redirect("/login");
};

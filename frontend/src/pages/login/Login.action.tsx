import { ActionFunctionArgs } from "@remix-run/router/utils";
import { redirect } from "react-router-dom";

import { login } from "../../lib/api/auth";
import { cacheDelete } from "../../lib/cache/cache";
import "./Login.css";

/**
 * React Router action.
 * @param request
 */
export async function loginAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  try {
    await cacheDelete("whoAmI");
    await login(username as string, password as string);
    const url = new URL(request.url);
    const next = url.searchParams.get("next") || "/";
    const nextPath = new URL(next, window.location.origin).pathname;

    return redirect(nextPath);
  } catch (e: unknown) {
    return await (e as Response).json();
  }
}

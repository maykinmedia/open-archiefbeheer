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
  const loginAbortController = new AbortController();

  try {
    await cacheDelete("", true);
    await login(
      username as string,
      password as string,
      loginAbortController.signal,
    );
    const url = new URL(request.url);
    const next = url.searchParams.get("next") || "/";
    const nextPath = new URL(next, window.location.origin).pathname;

    return redirect(nextPath);
  } catch (e: unknown) {
    return await (e as Response).json();
  }
}

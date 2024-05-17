import { LoaderFunction } from "@remix-run/router/utils";
import { LoaderFunctionArgs, redirect } from "react-router-dom";

/**
 * Wraps an async API function with authentication protection. Redirects to the sign-in page if the request fails with a
 * 403 status code.
 * @param fn The async API function to be wrapped.
 * @param args The arguments to be passed to the async API function.
 * @returns A function that, when called, executes the wrapped async API function with the provided arguments.
 */
export function loginRequired<T, A extends unknown[]>(
  fn: (
    loaderFunctionArgs: LoaderFunctionArgs,
    handlerCtx: unknown,
    ...args: A
  ) => Promise<T>,
  ...args: A
): LoaderFunction {
  return async (loaderFunctionArgs, handlerCtx) => {
    try {
      return await fn(loaderFunctionArgs, handlerCtx, ...args);
    } catch (e: unknown) {
      if ((e as Response)?.status === 403) {
        return redirect("/login");
      }
      throw e;
    }
  };
}

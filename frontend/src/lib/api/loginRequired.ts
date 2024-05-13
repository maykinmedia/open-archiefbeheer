import { redirect } from "react-router-dom";

/**
 * Wraps an async API function with authentication protection. Redirects to the sign-in page if the request fails with a
 * 403 status code.
 * @param fn The async API function to be wrapped.
 * @param args The arguments to be passed to the async API function.
 * @returns A function that, when called, executes the wrapped async API function with the provided arguments.
 */
export function loginRequired<T>(
  fn: (...args: unknown[]) => Promise<T>,
  ...args: unknown[]
): () => Promise<T | Response> {
  return async () => {
    try {
      return await fn(...args);
    } catch (e: any) {
      if (e?.status === 403) {
        return redirect("/sign-in");
      }
      throw e;
    }
  };
}

import type { LoaderFunction } from "@remix-run/router/utils";

import { cacheDelete } from "./lib/cache/cache";

/**
 * Handles application wide loading behavior.
 * @param request
 * @param params
 */
export const appLoader: LoaderFunction = async ({ request }) => {
  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  // If hijack search param is set, delete "whoAmI" cache.
  if (searchParams.hijack) {
    await cacheDelete("whoAmI");
  }
  return true;
};

import { request } from "./request";

export type AppInfo = {
  release: string;
  gitSha: string;
};

/**
 * List all the users that have the permission to archive destruction lists.
 */
export async function getAppInfo(signal?: AbortSignal) {
  const response = await request(
    "GET",
    "/app-info",
    undefined,
    undefined,
    undefined,
    signal,
  );
  const promise: Promise<AppInfo> = response.json();
  return promise;
}

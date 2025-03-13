import { request } from "./request";

export type AppInfo = {
  release: string;
  gitSha: string;
};

/**
 * Get app info data for the git version
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

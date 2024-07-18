import { request } from "./request";

export type GetArchiveConfigReturn = {
  zaaktypesShortProcess: string[]; // List of zaaktypes that should use the short process
};
/**
 * API call to get the archive configuration
 * @returns {Promise<GetArchiveConfigReturn>} The archive configuration
 * @throws {Error} If the request fails
 * @example
 * const archiveConfig = await getArchiveConfig();
 * console.log(archiveConfig);
 */
export async function getArchiveConfig(): Promise<GetArchiveConfigReturn> {
  const response = await request("GET", "/archive-config");
  const promise: Promise<GetArchiveConfigReturn> = response.json();
  return promise;
}

export type PatchArchiveConfigPayload = GetArchiveConfigReturn;
export type PatchArchiveConfigReturn = void;
/**
 * API call to PATCH the archive configuration
 * @param {PatchArchiveConfigPayload} archiveConfig The archive configuration
 * @returns {Promise<PatchArchiveConfigReturn>} The archive configuration
 * @throws {Error} If the request fails
 * @example
 * await patchArchiveConfig(archiveConfig);
 * console.log("Archive configuration updated");
 */
export async function patchArchiveConfig(
  archiveConfig: PatchArchiveConfigPayload,
): Promise<void> {
  const response = await request(
    "PATCH",
    "/archive-config",
    undefined,
    archiveConfig,
  );
  await response.json();
}

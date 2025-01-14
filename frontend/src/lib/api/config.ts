import { request } from "./request";

export type ArchiveConfiguration = {
  zaaktypesShortProcess: string[]; // List of zaaktypes that should use the short process
};
/**
 * API call to get the archive configuration
 * @returns {Promise<ArchiveConfiguration>} The archive configuration
 * @throws {Error} If the request fails
 * @example
 * const archiveConfig = await getArchiveConfig();
 * console.log(archiveConfig);
 */
export async function getArchiveConfiguration(): Promise<ArchiveConfiguration> {
  const response = await request("GET", "/archive-config");
  const promise: Promise<ArchiveConfiguration> = response.json();
  return promise;
}

/**
 * API call to PATCH the archive configuration
 * @param {ArchiveConfiguration } archiveConfig The archive configuration
 * @returns {Promise<void>} The archive configuration
 * @throws {Error} If the request fails
 * @example
 * await patchArchiveConfig(archiveConfig);
 * console.log("Archive configuration updated");
 */
export async function patchArchiveConfiguration(
  archiveConfig: ArchiveConfiguration,
): Promise<void> {
  await request("PATCH", "/archive-config", undefined, archiveConfig);
}

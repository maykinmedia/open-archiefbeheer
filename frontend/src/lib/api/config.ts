import { request } from "./request";

export type ArchiveConfiguration = {
  /**
   *  If a destruction list only contains cases with types present in this
   * field, this list will have a shortened review process. This means that no
   * archivist will have to approve this list before it is deleted.
   */
  zaaktypesShortProcess: string[]; // List of zaaktypes that should use the short process

  /** Source organisation RSIN */
  bronorganisatie: string;

  /**
   * The case type URL to use when creating the case for the destruction list
   * deletion.
   */
  zaaktype: string;

  /**
   * The status type URL to use when creating the case for the destruction list
   * deletion.
   */
  statustype: string;

  /**
   * The result type URL to use when creating the case for the destruction list
   * deletion.
   */
  resultaattype: string;

  /**
   * The selectielijstklasse URL to use when creating the case for the
   * destruction list deletion.
   */
  informatieobjecttype: string;

  /**
   * The selectielijstklasse URL to use when creating the case for the
   * destruction list deletion.
   */
  selectielijstklasse: string;
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

import { request } from "./request";

export type ZaaktypeChoice = {
  /** The description field of the zaaktype. */
  label: string;

  /** The URL field of the zaaktype. */
  value: string;

  /** A combination of the identification and the date on which the zaaktype will no longer be valid (if present). */
  extra: string;
};

/**
 * Retrieve zaaktypen from Open Zaak and return a value and a label per zaaktype. The label is the 'omschrijving' field
 * an the value is the URL. The response is cached for 15 minutes.
 */
export async function listZaaktypeChoices() {
  const response = await request("GET", "/_zaaktypen-choices");
  const promise: Promise<ZaaktypeChoice[]> = response.json();
  return promise;
}

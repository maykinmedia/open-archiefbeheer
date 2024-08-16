import { isPrimitive } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";

export type ZaakSelection<DetailType = unknown> = {
  /**
   * A `Zaak.url` mapped to a `boolean`.
   * - `true`: The zaak is added to the selection.
   * - `false`: The zaak is removed from the selection.
   */
  [index: string]: {
    selected: boolean;
    detail?: DetailType;
  };
};

/**
 * Adds `zaken` to zaak selection identified by key.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @param detail An optional detail object of generic type
 */
export async function addToZaakSelection<DetailType = unknown>(
  key: string,
  zaken: string[] | Zaak[],
  detail?: DetailType,
) {
  await _mutateZaakSelection(key, zaken, true, detail);
}

/**
 * Removes `zaken` from zaak selection identified by key.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 */
export async function removeFromZaakSelection(
  key: string,
  zaken: string[] | Zaak[],
) {
  await _mutateZaakSelection(key, zaken, false);
}

/**
 * Marks all zaken as selected.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param selected Indicating whether the selection should be added (`true) or removed (`false).
 */
export async function getAllZakenSelected(key: string) {
  const computedKey = `${_getComputedKey(key)}.allSelected`;
  const json = sessionStorage.getItem(computedKey) || "false";
  return JSON.parse(json) as boolean;
}

/**
 * Marks all zaken as selected.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param selected Indicating whether the selection should be added (`true) or removed (`false).
 */
export async function setAllZakenSelected(key: string, selected: boolean) {
  const computedKey = `${_getComputedKey(key)}.allSelected`;
  const json = JSON.stringify(selected);
  sessionStorage.setItem(computedKey, json);

  if (!selected) {
    await clearZaakSelection(key);
  }
}

/**
 * Gets the zaak selection.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 */
export async function getZaakSelection<DetailType = unknown>(key: string) {
  const computedKey = _getComputedKey(key);
  const json = sessionStorage.getItem(computedKey) || "{}";
  return JSON.parse(json) as ZaakSelection<DetailType>;
}

/**
 * Sets zaak selection cache.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param zaakSelection
 */
export async function setZaakSelection<DetailType = unknown>(
  key: string,
  zaakSelection: ZaakSelection<DetailType>,
) {
  const computedKey = _getComputedKey(key);
  const json = JSON.stringify(zaakSelection);
  sessionStorage.setItem(computedKey, json);
}

/**
 * Clears zaak selection cache.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 */
export async function clearZaakSelection(key: string) {
  const computedKey = _getComputedKey(key);
  const json = "{}";
  sessionStorage.setItem(computedKey, json);
}

/**
 * Returns whether zaak is selected.
 * @param key A key identifying the selection
 * @param zaak Either a `Zaak.url` or `Zaak` object.
 */
export async function isZaakSelected<DetailType = unknown>(
  key: string,
  zaak: string | Zaak,
) {
  const zaakSelection = await getZaakSelection<DetailType>(key);
  const url = _getZaakUrl(zaak);
  return zaakSelection[url]?.selected;
}

/**
 * Mutates the zaak selection
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @param selected Indicating whether the selection should be added (`true) or removed (`false).
 * @param detail An optional detail object of generic type
 */
export async function _mutateZaakSelection<DetailType = unknown>(
  key: string,
  zaken: string[] | Zaak[],
  selected: boolean,
  detail?: DetailType,
) {
  const currentZaakSelection = await getZaakSelection<DetailType>(key);
  const urls = _getZaakUrls(zaken);

  const zaakSelectionOverrides = urls.reduce<ZaakSelection<DetailType>>(
    (partialZaakSelection, url) => ({
      ...partialZaakSelection,
      [url]: {
        selected,
        detail,
      },
    }),
    {},
  );

  const combinedZaakSelection = {
    ...currentZaakSelection,
    ...zaakSelectionOverrides,
  };

  await setZaakSelection(key, combinedZaakSelection);
}

/**
 * Computes the prefixed cache key.
 * @param key A key identifying the selection
 */
function _getComputedKey(key: string): string {
  return `oab.lib.zaakSelection.${key}`;
}

/**
 * Returns the urls based on an `Array` of `string`s or `Zaak` objects.
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 */
function _getZaakUrls(zaken: Array<string | Zaak>) {
  return zaken.map(_getZaakUrl);
}

/**
 * Returns the url based on a `string` or `Zaak` object.
 * @param zaak Either a `Zaak.url` or `Zaak` object.
 */
function _getZaakUrl(zaak: string | Zaak) {
  return isPrimitive(zaak) ? zaak : (zaak.url as string);
}

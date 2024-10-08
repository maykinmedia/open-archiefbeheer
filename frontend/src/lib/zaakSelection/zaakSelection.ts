import { isPrimitive } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";

// FIXME: Limit to object type without breaking (or with fixing) other code.
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
  zaken: (string | Zaak)[],
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
  zaken: (string | Zaak)[],
) {
  await _mutateZaakSelection(key, zaken, false);
}

/**
 * Check if all zaken are selected.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
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
 * Gets the zaak selection, applies a filter to the detail object.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param exp
 * @param selectedOnly
 */
export async function getFilteredZaakSelection<DetailType = unknown>(
  key: string,
  exp?: Partial<DetailType>,
  selectedOnly = true,
) {
  const selection = await _getZaakSelection<DetailType>(key);
  const entries = Object.entries(selection);

  const filteredEntries = entries.filter(([url, { selected, detail }]) => {
    const _detail: Record<string, unknown> = detail || {};
    const selectionFilter = !selectedOnly || selected;

    const expFilter =
      !exp ||
      (detail &&
        Object.entries(exp).every(([key, value]) => _detail[key] === value));

    return selectionFilter && expFilter;
  });

  return Object.fromEntries(filteredEntries);
}

/**
 * Gets the number of selected zaken.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param exp
 * @param selectedOnly
 */
export async function getZaakSelectionSize<DetailType = unknown>(
  key: string,
  exp?: Partial<DetailType>,
  selectedOnly = true,
) {
  const selection = await getFilteredZaakSelection(key, exp, selectedOnly);
  return Object.keys(selection).length;
}

/**
 * Returns a single zaak in the zaak selection.
 * @param key A key identifying the selection
 * @param zaak Either a `Zaak.url` or `Zaak` object.
 * @param selectedOnly
 */
export async function getZaakSelectionItem<DetailType = unknown>(
  key: string,
  zaak: string | Zaak,
  selectedOnly = true,
) {
  const zaakSelection = await _getZaakSelection<DetailType>(key);
  const url = _getZaakUrl(zaak);
  return zaakSelection[url]?.selected || !selectedOnly
    ? zaakSelection[url]
    : undefined;
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
  const zaakSelection = await _getZaakSelection<DetailType>(key);
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
  zaken: (string | Zaak)[],
  selected: boolean,
  detail?: DetailType | DetailType[],
) {
  if (Array.isArray(detail)) {
    if (detail.length !== (zaken as Zaak[]).length) {
      throw new Error(
        "Can't mutate Zaak selection, length of `zaken` is not equal to length of given `detail`!",
      );
    }
  }

  const currentZaakSelection = await _getZaakSelection<DetailType>(key);
  const urls = _getZaakUrls(zaken);

  const zaakSelectionOverrides = urls.reduce<ZaakSelection<DetailType>>(
    (partialZaakSelection, url, i) => ({
      ...partialZaakSelection,
      [url]: {
        selected,
        detail: Array.isArray(detail) ? detail[i] : detail,
      },
    }),
    {},
  );

  const combinedZaakSelection = {
    ...currentZaakSelection,
    ...zaakSelectionOverrides,
  };

  return setZaakSelection(key, combinedZaakSelection);
}

/**
 * Gets the zaak selection.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @private
 */
async function _getZaakSelection<DetailType = unknown>(key: string) {
  const computedKey = _getComputedKey(key);
  const json = sessionStorage.getItem(computedKey) || "{}";
  return JSON.parse(json) as ZaakSelection<DetailType>;
}

/**
 * @deprecated public use outside  `zaakSelection.ts` is deprecated due to performance concerns.
 */
export async function getZaakSelection<DetailType = unknown>(key: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn("public use of _getZaakSelection is deprecated.");
  }

  return _getZaakSelection<DetailType>(key);
}

/**
 * Computes the prefixed cache key.
 * @param key A key identifying the selection
 * @private
 */
function _getComputedKey(key: string): string {
  return `oab.lib.zaakSelection.${key}`;
}

/**
 * Returns the urls based on an `Array` of `string`s or `Zaak` objects.
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @private
 */
function _getZaakUrls(zaken: Array<string | Zaak>) {
  return zaken.map(_getZaakUrl);
}

/**
 * Returns the url based on a `string` or `Zaak` object.
 * @param zaak Either a `Zaak.url` or `Zaak` object.
 * @private
 */
function _getZaakUrl(zaak: string | Zaak) {
  return isPrimitive(zaak) ? zaak : (zaak.url as string);
}

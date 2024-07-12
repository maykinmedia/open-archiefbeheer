import { isPrimitive } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import {
  addToRemoteZaakSelection,
  clearRemoteZaakSelection,
  getRemoteZaakSelection,
  removeFromRemoteZaakSelection,
} from "../api/zaakSelection";

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
 * @param remote If true, the zaak selection is synced to the backend.
 */
export async function addToZaakSelection<DetailType = unknown>(
  key: string,
  zaken: string[] | Zaak[],
  detail?: DetailType,
  remote = false,
) {
  console.log("addToZaakSelection");
  await _mutateLocalZaakSelection(key, zaken, true, detail);

  if (remote) {
    await addToRemoteZaakSelection(
      key,
      zaken.map((z) => (isPrimitive(z) ? z : (z.url as string))),
      detail,
    );
  }
}

/**
 * Removes `zaken` from zaak selection identified by key.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @param remote If true, the zaak selection is synced to the backend.
 */
export async function removeFromZaakSelection(
  key: string,
  zaken: string[] | Zaak[],
  remote = false,
) {
  console.log("removeFromZaakSelection");
  await _mutateLocalZaakSelection(key, zaken, false);

  if (remote) {
    await removeFromRemoteZaakSelection(
      key,
      zaken.map((z) => (isPrimitive(z) ? z : (z.url as string))),
    );
  }
}

/**
 * Gets the zaak selection.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param remote If true, the zaak selection is obtained from the backend.
 */
export async function getZaakSelection<DetailType = unknown>(
  key: string,
  remote = false,
) {
  console.log("getZaakSelection");

  if (remote) {
    return (await getRemoteZaakSelection(key)) as ZaakSelection<DetailType>;
  } else {
    const computedKey = _getComputedKey(key);
    const json = sessionStorage.getItem(computedKey) || "{}";
    return JSON.parse(json) as ZaakSelection<DetailType>;
  }
}

/**
 * Clears zaak selection cache.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param remote If true, the zaak selection is synced to the backend.
 */
export async function clearZaakSelection(key: string, remote = false) {
  console.log("clearZaakSelection");

  const computedKey = _getComputedKey(key);
  const json = "{}";
  sessionStorage.setItem(computedKey, json);

  if (remote) {
    await clearRemoteZaakSelection(key);
  }
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
export async function _mutateLocalZaakSelection<DetailType = unknown>(
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

  await _setLocalZaakSelection(key, combinedZaakSelection);
}

/**
 * Sets zaak selection cache.
 * Note: only the `url` of selected `zaken` are stored.
 * Note: This function is async to accommodate possible future refactors.
 * @param key A key identifying the selection
 * @param zaakSelection
 */
export async function _setLocalZaakSelection<DetailType = unknown>(
  key: string,
  zaakSelection: ZaakSelection<DetailType>,
) {
  console.log("setZaakSelection");

  const computedKey = _getComputedKey(key);
  const json = JSON.stringify(zaakSelection);
  sessionStorage.setItem(computedKey, json);
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

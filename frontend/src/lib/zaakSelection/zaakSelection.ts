import { isPrimitive } from "@maykin-ui/admin-ui";

import { Zaak } from "../../types";
import { whoAmI } from "../api/auth";
import {
  ZaakSelection,
  ZaakSelectionItem,
  addToRemoteZaakSelection,
  clearRemoteZaakSelection,
  getRemoteZaakSelection,
  removeFromRemoteZaakSelection,
} from "../api/zaakSelection";

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
  if (remote) {
    return await getRemoteZaakSelection<DetailType>(key);
  } else {
    const computedKey = _getComputedKey(key);
    const defaultZaakSelection: ZaakSelection = {
      key: key,
      lastUpdated: "",
      lastUpdatedBy: await whoAmI(),
      items: [],
    };
    const json =
      sessionStorage.getItem(computedKey) ||
      JSON.stringify(defaultZaakSelection);
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
  const currentItems = currentZaakSelection?.items || [];
  const newItems = _getZaakUrls(zaken).map<ZaakSelectionItem<DetailType>>(
    (url) => ({
      zaak: url,
      selected,
      detail: detail as DetailType,
    }),
  );

  const combinedItems = [...currentItems, ...newItems];

  const distinctItems = Object.values(
    combinedItems.reduce<{ [index: string]: ZaakSelectionItem }>(
      (acc, i) => ({ ...acc, [i.zaak as string]: i }),
      {},
    ),
  );

  await _setLocalZaakSelection(key, {
    ...currentZaakSelection,
    items: distinctItems,
  });
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

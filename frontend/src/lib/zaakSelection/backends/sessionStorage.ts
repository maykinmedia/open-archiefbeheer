import {
  ZaakIdentifier,
  ZaakSelection,
  ZaakSelectionBackend,
  ZaakSelectionBackendMeta,
  _getZaakUrl,
  _getZaakUrls,
} from "../";

export const SessionStorageBackend: ZaakSelectionBackend = {
  /**
   * Adds `zaken` to zaak selection identified by key.
   * @param key A key identifying the selection
   * @param zaken An array containing either `Zaak.url` or `Zaak` objects
   * @param detail An optional detail object of generic type
   * @param _
   */
  async addToZaakSelection<DetailType = unknown>(
    key: string,
    zaken: (string | ZaakIdentifier)[],
    detail?: DetailType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: ZaakSelectionBackendMeta,
  ) {
    await _mutateZaakSelection(key, zaken, true, detail);
  },

  /**
   * Removes `zaken` from zaak selection identified by key.
   * @param key A key identifying the selection
   * @param zaken An array containing either `Zaak.url` or `Zaak` objects
   * @param _
   */
  async removeFromZaakSelection(
    key: string,
    zaken: (string | ZaakIdentifier)[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: ZaakSelectionBackendMeta,
  ) {
    await _mutateZaakSelection(key, zaken, false);
  },

  /**
   * Check if all zaken are selected.
   * @param key A key identifying the selection
   * @param _
   */

  async getAllZakenSelected(
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: ZaakSelectionBackendMeta,
  ) {
    const computedKey = `${_getComputedKey(key)}.allSelected`;
    const json = sessionStorage.getItem(computedKey) || "false";
    return JSON.parse(json) as boolean;
  },

  /**
   * Marks all zaken as selected.
   * @param key A key identifying the selection
   * @param selected Indicating whether the selection should be added (`true) or removed (`false).
   * @param _
   */
  async setAllZakenSelected(
    key: string,
    selected: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: ZaakSelectionBackendMeta,
  ) {
    const computedKey = `${_getComputedKey(key)}.allSelected`;
    const json = JSON.stringify(selected);
    sessionStorage.setItem(computedKey, json);

    if (!selected) {
      await SessionStorageBackend.clearZaakSelection(key);
    }
  },

  /**
   * Gets the zaak selection, applies a filter to the detail object.
   * @param key A key identifying the selection
   * @param exp
   * @param selectedOnly
   * @param _
   */
  async getFilteredZaakSelection<DetailType = unknown>(
    key: string,
    exp?: Partial<DetailType>,
    selectedOnly = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: ZaakSelectionBackendMeta,
  ) {
    const selection = await _getZaakSelection<DetailType>(key);
    const entries = Object.entries(selection);

    const filteredEntries = entries.filter(([, { selected, detail }]) => {
      const _detail: Record<string, unknown> = detail || {};
      const selectionFilter = !selectedOnly || selected;

      const expFilter =
        !exp ||
        (detail &&
          Object.entries(exp).every(([key, value]) => _detail[key] === value));

      return selectionFilter && expFilter;
    });

    return Object.fromEntries(filteredEntries);
  },

  /**
   * Gets the number of selected zaken.
   * WARNING: THIS DOES NOT TAKE ALL ZAKEN SELECTED INTO ACCOUNT!
   * @param key A key identifying the selection
   * @param _
   */
  async getZaakSelectionSize(
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: ZaakSelectionBackendMeta,
  ) {
    const selection = await SessionStorageBackend.getFilteredZaakSelection(
      key,
      undefined,
      true,
    );
    return Object.keys(selection).length;
  },

  /**
   * Returns all zaken in the zaak selection.
   * @param key A key identifying the selection
   * @param zaken An array containing either `Zaak.url` or `Zaak` objects
   * @param selectedOnly
   * @param _
   */
  async getZaakSelectionItems<DetailType = unknown>(
    key: string,
    zaken: (string | ZaakIdentifier)[],
    selectedOnly = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: ZaakSelectionBackendMeta,
  ) {
    const zaakSelection = await _getZaakSelection<DetailType>(key);
    return zaken.reduce<ZaakSelection<DetailType>>((acc, zaak) => {
      const url = _getZaakUrl(zaak);
      const item =
        zaakSelection[url]?.selected || !selectedOnly
          ? zaakSelection[url]
          : undefined;

      return !item ? acc : { ...acc, [url]: item };
    }, {});
  },

  /**
   * Clears zaak selection cache.
   * @param key A key identifying the selection
   * @param _
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async clearZaakSelection(key: string, _?: ZaakSelectionBackendMeta) {
    const computedKey = _getComputedKey(key);
    const json = "{}";
    sessionStorage.setItem(computedKey, json);
  },
};

/**
 * Mutates the zaak selection
 * @param key A key identifying the selection
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @param selected Indicating whether the selection should be added (`true) or removed (`false).
 * @param detail An optional detail object of generic type
 */
export async function _mutateZaakSelection<DetailType = unknown>(
  key: string,
  zaken: (string | ZaakIdentifier)[],
  selected: boolean,
  detail?: DetailType | DetailType[],
) {
  if (Array.isArray(detail)) {
    if (detail.length !== (zaken as ZaakIdentifier[]).length) {
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

  return _setZaakSelection(key, combinedZaakSelection);
}

/**
 * Gets the zaak selection.
 * @param key A key identifying the selection
 * @private
 */
export async function _getZaakSelection<DetailType = unknown>(key: string) {
  const computedKey = _getComputedKey(key);
  const json = sessionStorage.getItem(computedKey) || "{}";
  return JSON.parse(json) as ZaakSelection<DetailType>;
}

/**
 * Sets zaak selection cache.
 * @param key A key identifying the selection
 * @param zaakSelection
 * @private
 */
export async function _setZaakSelection<DetailType = unknown>(
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
 * @private
 */
function _getComputedKey(key: string): string {
  return `oab.lib.zaakSelection.${key}`;
}

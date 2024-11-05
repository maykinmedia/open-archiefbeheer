import { Zaak } from "../../../types";
import {
  deleteSelection,
  getAllSelected,
  getSelection,
  getSelectionItems,
  getSelectionSize,
  setAllSelected,
  updateSelection,
} from "../../api/zaakSelection";
import { ZaakSelectionBackend, ZaakSelectionBackendMeta } from "../types";
import { _zaken2zaakSelection } from "../utils";

export const RestBackend: ZaakSelectionBackend = {
  /**
   * Adds `zaken` to zaak selection identified by key.
   * @param key A key identifying the selection
   * @param zaken An array containing either `Zaak.url` or `Zaak` objects
   * @param detail An optional detail object of generic type
   * @param meta
   */
  async addToZaakSelection<DetailType = unknown>(
    key: string,
    zaken: (string | Zaak)[],
    detail?: DetailType,
    meta?: ZaakSelectionBackendMeta,
  ) {
    await updateSelection<DetailType>(
      key,
      _zaken2zaakSelection<DetailType>(zaken, true, detail),
      _meta2signal(meta),
    );
  },

  /**
   * Removes `zaken` from zaak selection identified by key.
   * @param key A key identifying the selection
   * @param zaken An array containing either `Zaak.url` or `Zaak` objects
   * @param meta
   */
  async removeFromZaakSelection<DetailType = unknown>(
    key: string,
    zaken: (string | Zaak)[],
    meta?: ZaakSelectionBackendMeta,
  ) {
    await updateSelection<DetailType>(
      key,
      _zaken2zaakSelection(zaken, false),
      _meta2signal(meta),
    );
  },

  /**
   * Check if all zaken are selected.
   * @param key A key identifying the selection
   * @param meta
   */
  async getAllZakenSelected(key: string, meta?: ZaakSelectionBackendMeta) {
    return getAllSelected(key, _meta2signal(meta));
  },

  /**
   * Marks all zaken as selected.
   * @param key A key identifying the selection
   * @param selected Indicating whether the selection should be added (`true`) or removed (`false`).
   * @param meta
   */
  async setAllZakenSelected(
    key: string,
    selected: boolean,
    meta?: ZaakSelectionBackendMeta,
  ) {
    return setAllSelected(key, selected, _meta2signal(meta));
  },

  /**
   * Gets the zaak selection, applies a filter to the detail object.
   * @param key A key identifying the selection
   * @param exp
   * @param selectedOnly
   * @param meta
   */
  async getFilteredZaakSelection<DetailType = unknown>(
    key: string,
    exp?: Partial<DetailType>,
    selectedOnly = true,
    meta?: ZaakSelectionBackendMeta,
  ) {
    return getSelection<DetailType>(key, exp, selectedOnly, _meta2signal(meta));
  },

  /**
   * Gets the number of selected zaken.
   * WARNING: THIS DOES NOT TAKE ALL ZAKEN SELECTED INTO ACCOUNT!
   * @param key A key identifying the selection
   * @param meta
   */
  async getZaakSelectionSize(key: string, meta?: ZaakSelectionBackendMeta) {
    const selection = await getSelectionSize(key, _meta2signal(meta));
    return selection.count;
  },

  /**
   * Returns all zaken in the zaak selection.
   * @param key A key identifying the selection
   * @param zaken An array containing either `Zaak.url` or `Zaak` objects
   * @param selectedOnly
   * @param meta
   */
  async getZaakSelectionItems<DetailType = unknown>(
    key: string,
    zaken: (string | Zaak)[],
    selectedOnly = true,
    meta?: ZaakSelectionBackendMeta,
  ) {
    return getSelectionItems<DetailType>(
      key,
      zaken,
      selectedOnly,
      _meta2signal(meta),
    );
  },

  /**
   * Clears zaak selection cache.
   * @param key A key identifying the selection
   * @param meta
   */
  async clearZaakSelection(key: string, meta?: ZaakSelectionBackendMeta) {
    return deleteSelection(key, _meta2signal(meta));
  },
};

/**
 * Returns `AbortSignal` or `undefined` based on `meta`.
 * @param meta
 * @private
 */
function _meta2signal(meta?: ZaakSelectionBackendMeta) {
  return meta?.signal instanceof AbortSignal ? meta.signal : undefined;
}

import { SessionStorageBackend, _getZaakSelection } from "./backends";
import type {
  ZaakIdentifier,
  ZaakSelection,
  ZaakSelectionBackendMeta,
} from "./types";

/**
 * Adds `zaken` to zaak selection identified by key.
 * @param key A key identifying the selection
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @param [detail] An optional detail object of generic type
 * @param [backend=SessionStorageBackend] The backend to use:
 *  - `SessionStorageBackend`: stores selection in browser (locally).
 *  - `APIBackend`: stores selection using an API, can be used to if the
 *    selection needs to be shared= among multiple users.
 * @param meta An optional `Record` allowing the implementation to pass backend
 *  specific context such as `AbortSignal`s.
 */
export async function addToZaakSelection<DetailType = unknown>(
  key: string,
  zaken: (string | ZaakIdentifier)[],
  detail?: DetailType,
  backend = SessionStorageBackend,
  meta?: ZaakSelectionBackendMeta,
) {
  return backend.addToZaakSelection<DetailType>(key, zaken, detail, meta);
}

/**
 * Removes `zaken` from zaak selection identified by key.
 * @param key A key identifying the selection
 * @param zaken An array containing either `Zaak.url` or `Zaak` objects
 * @param [backend=SessionStorageBackend] The backend to use:
 *  - `SessionStorageBackend`: stores selection in browser (locally).
 *  - `APIBackend`: stores selection using an API, can be used to if the
 *    selection needs to be shared= among multiple users.
 * @param meta An optional `Record` allowing the implementation to pass backend
 *  specific context such as `AbortSignal`s.
 */
export async function removeFromZaakSelection(
  key: string,
  zaken: (string | ZaakIdentifier)[],
  backend = SessionStorageBackend,
  meta?: ZaakSelectionBackendMeta,
) {
  return backend.removeFromZaakSelection(key, zaken, meta);
}

/**
 * Check if all zaken are selected.
 * @param key A key identifying the selection
 * @param backend
 * @param meta An optional `Record` allowing the implementation to pass backend
 *  specific context such as `AbortSignal`s.
 */
export async function getAllZakenSelected(
  key: string,
  backend = SessionStorageBackend,
  meta?: ZaakSelectionBackendMeta,
) {
  return backend.getAllZakenSelected(key, meta);
}

/**
 * Marks all zaken as selected.
 * @param key A key identifying the selection
 * @param selected Indicating whether the selection should be added (`true) or removed (`false).
 * @param [backend=SessionStorageBackend] The backend to use:
 *  - `SessionStorageBackend`: stores selection in browser (locally).
 *  - `APIBackend`: stores selection using an API, can be used to if the
 *    selection needs to be shared= among multiple users.
 * @param meta An optional `Record` allowing the implementation to pass backend
 *  specific context such as `AbortSignal`s.
 */
export async function setAllZakenSelected(
  key: string,
  selected: boolean,
  backend = SessionStorageBackend,
  meta?: ZaakSelectionBackendMeta,
) {
  return backend.setAllZakenSelected(key, selected, meta);
}

/**
 * Gets the zaak selection, applies a filter to the detail object.
 * @param key A key identifying the selection
 * @param exp
 * @param selectedOnly
 * @param [backend=SessionStorageBackend] The backend to use:
 *  - `SessionStorageBackend`: stores selection in browser (locally).
 *  - `APIBackend`: stores selection using an API, can be used to if the
 *    selection needs to be shared= among multiple users.
 * @param meta An optional `Record` allowing the implementation to pass backend
 * specific context such as `AbortSignal`s.
 */
export async function getFilteredZaakSelection<DetailType = unknown>(
  key: string,
  exp?: Partial<DetailType>,
  selectedOnly = true,
  backend = SessionStorageBackend,
  meta?: ZaakSelectionBackendMeta,
) {
  return backend.getFilteredZaakSelection<DetailType>(
    key,
    exp,
    selectedOnly,
    meta,
  );
}

/**
 * Gets the number of selected zaken.
 * WARNING: THIS DOES NOT TAKE ALL ZAKEN SELECTED INTO ACCOUNT!
 * @param key A key identifying the selection
 * @param [backend=SessionStorageBackend] The backend to use:
 *  - `SessionStorageBackend`: stores selection in browser (locally).
 *  - `APIBackend`: stores selection using an API, can be used to if the
 *    selection needs to be shared= among multiple users.
 * @param meta An optional `Record` allowing the implementation to pass backend
 *  specific context such as `AbortSignal`s.
 */
export async function getZaakSelectionSize(
  key: string,
  backend = SessionStorageBackend,
  meta?: ZaakSelectionBackendMeta,
) {
  return backend.getZaakSelectionSize(key, meta);
}

/**
 * Returns all zaken in the zaak selection.
 * @param key A key identifying the selection
 * @param zaak
 * @param selectedOnly
 * @param [backend=SessionStorageBackend] The backend to use:
 *  - `SessionStorageBackend`: stores selection in browser (locally).
 *  - `APIBackend`: stores selection using an API, can be used to if the
 *    selection needs to be shared= among multiple users.
 * @param meta An optional `Record` allowing the implementation to pass backend
 * specific context such as `AbortSignal`s.
 */
export async function getZaakSelectionItems<DetailType = unknown>(
  key: string,
  zaak: (string | ZaakIdentifier)[],
  selectedOnly = true,
  backend = SessionStorageBackend,
  meta?: ZaakSelectionBackendMeta,
) {
  return backend.getZaakSelectionItems<DetailType>(
    key,
    zaak,
    selectedOnly,
    meta,
  );
}

/**
 * Clears zaak selection cache.
 * @param key A key identifying the selection
 * @param [backend=SessionStorageBackend] The backend to use:
 *  - `SessionStorageBackend`: stores selection in browser (locally).
 *  - `APIBackend`: stores selection using an API, can be used to if the
 *    selection needs to be shared= among multiple users.
 * @param meta An optional `Record` allowing the implementation to pass backend
 * specific context such as `AbortSignal`s.
 */
export async function clearZaakSelection(
  key: string,
  backend = SessionStorageBackend,
  meta?: ZaakSelectionBackendMeta,
) {
  return backend.clearZaakSelection(key, meta);
}

/**
 * Compares whether `ZaakSelection` a equals `ZaakSelection` b.
 * @param a
 * @param b
 */
export function compareZaakSelection(a: ZaakSelection, b: ZaakSelection) {
  const _a = Object.fromEntries(Object.entries(a).sort());
  const _b = Object.fromEntries(Object.entries(b).sort());
  return JSON.stringify(_a) === JSON.stringify(_b);
}

/**
 * @deprecated public use outside  `zaakSelection.ts` is deprecated due to performance concerns.
 */
export async function getZaakSelection<DetailType = unknown>(key: string) {
  if (import.meta.env.DEV) {
    console.warn(
      "public use of _getZaakSelection is deprecated, and is only available on SessionStorageBackend.",
    );
  }

  return _getZaakSelection<DetailType>(key);
}

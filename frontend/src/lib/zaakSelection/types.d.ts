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
 * A type describing the interface for a backend implementing zaak selection.
 */
export type ZaakSelectionBackend = {
  /**
   * Adds `zaken` to the zaak selection identified by key.
   */
  addToZaakSelection<DetailType = unknown>(
    key: string,
    zaken: (string | Zaak)[],
    detail?: DetailType,
    meta?: ZaakSelectionBackendMeta,
  ): Promise<void>;

  /**
   * Removes `zaken` from the zaak selection identified by key.
   */
  removeFromZaakSelection(
    key: string,
    zaken: (string | Zaak)[],
    meta?: ZaakSelectionBackendMeta,
  ): Promise<void>;

  /**
   * Checks if all zaken are selected.
   */
  getAllZakenSelected(
    key: string,
    meta?: ZaakSelectionBackendMeta,
  ): Promise<boolean>;

  /**
   * Marks all zaken as selected.
   */
  setAllZakenSelected(
    key: string,
    selected: boolean,
    meta?: ZaakSelectionBackendMeta,
  ): Promise<void>;

  /**
   * Gets the zaak selection, applying a filter to the detail object.
   */
  getFilteredZaakSelection<DetailType = unknown>(
    key: string,
    exp?: Partial<DetailType>,
    selectedOnly?: boolean,
    meta?: ZaakSelectionBackendMeta,
  ): Promise<ZaakSelection<DetailType>>;

  /**
   * Gets the number of selected zaken.
   */
  getZaakSelectionSize(
    key: string,
    meta?: ZaakSelectionBackendMeta,
  ): Promise<number>;

  /**
   * Returns all zaken in the zaak selection.
   */
  getZaakSelectionItems<DetailType = unknown>(
    key: string,
    zaken: (string | Zaak)[],
    selectedOnly?: boolean,
    meta?: ZaakSelectionBackendMeta,
  ): Promise<ZaakSelection<DetailType>>;

  /**
   * Clears zaak selection cache.
   */
  clearZaakSelection(
    key: string,
    meta?: ZaakSelectionBackendMeta,
  ): Promise<void>;
};

/**
 * An optional `Record` allowing the implementation to pass backend specific
 * context such as `AbortSignal`s.
 */
export type ZaakSelectionBackendMeta = Record<string, unknown>;

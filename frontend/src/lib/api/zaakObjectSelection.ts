import { ZaakObject } from "../../types";
import { request } from "./request";

export type ZaakObjectSelectionItem = {
  /**
   * The `ZaakObject` url to (de)select (same as `result.url`),
   * here for convenience/consistency with `ZaakObjectSelectionMutation`.
   */
  url: string;

  /**
   * Whether the `ZaakObject` is (de)selected for destruction.
   */
  selected: boolean;

  /**
   * Whether the destruction of  `ZaakObject` is supported.
   */
  supported: boolean;

  /**
   * The `ZaakObject` instance.
   */
  result: ZaakObject;
};

export type ZaakObjectSelectionItemMutation = {
  /** The `ZaakObject` url to (de)select.  */
  url: string;

  /**
   * Whether to (de)select the `ZaakObject` for destruction.
   */
  selected: boolean;
};

/**
 * Lists the (de)selection of `ZaakObject`s attached to a `DestructionListItem`.
 * @param destructionListItemPk - The pk of the `DestructionListItem`.
 * @param signal - `AbortController` signal.
 */
export async function listZaakObjectSelection(
  destructionListItemPk: number,
  signal?: AbortSignal,
): Promise<ZaakObjectSelectionItem[]> {
  const response = await request(
    "GET",
    `/destruction-list-items/${destructionListItemPk}/zaakobjects`,
    undefined,
    undefined,
    undefined,
    signal,
  );
  return response.json();
}

/**
 * Lists the (de)selection of `ZaakObject`s attached to a `DestructionListItem`.
 * @param destructionListItemPk - The pk of the `DestructionListItem`.
 * @param mutations - The updated selection.
 * @param signal - `AbortController` signal.
 */
export async function updateZaakObjectSelection(
  destructionListItemPk: number,
  mutations: ZaakObjectSelectionItemMutation[],
  signal?: AbortSignal,
): Promise<ZaakObjectSelectionItemMutation[]> {
  const response = await request(
    "PATCH",
    `/destruction-list-items/${destructionListItemPk}/zaakobjects`,
    undefined,
    mutations,
    undefined,
    signal,
  );
  return response.json();
}

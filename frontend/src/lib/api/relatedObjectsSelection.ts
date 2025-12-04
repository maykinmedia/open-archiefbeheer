import { ZaakObject } from "../../types";
import { request } from "./request";

export type RelatedObjectsSelectionItem = {
  /**
   * The url to (de)select (same as `result.url`),
   * here for convenience/consistency with `RelatedObjectsSelectionItemMutation`.
   */
  url: string;

  /**
   * Whether the related object is (de)selected for destruction.
   */
  selected: boolean;

  /**
   * Whether the destruction of the related object is supported.
   */
  supported: boolean;

  /**
   * The related object.
   */
  result: ZaakObject;
};

export type RelatedObjectsSelectionItemMutation = {
  /** The url to (de)select. */
  url: string;

  /**
   * Whether the related object is (de)selected for destruction.
   */
  selected: boolean;
};

/**
 * Lists the (de)selection of related objects attached to a `DestructionListItem`.
 * @param destructionListItemPk - The pk of the `DestructionListItem`.
 * @param signal - `AbortController` signal.
 */
export async function listRelatedObjectsSelection(
  destructionListItemPk: number,
  signal?: AbortSignal,
): Promise<RelatedObjectsSelectionItem[]> {
  const response = await request(
    "GET",
    `/destruction-list-items/${destructionListItemPk}/related-objects-selection/`,
    undefined,
    undefined,
    undefined,
    signal,
  );
  return response.json();
}

/**
 * Lists the (de)selection of related objects attached to a `DestructionListItem`.
 * @param destructionListItemPk - The pk of the `DestructionListItem`.
 * @param mutations - The updated selection.
 * @param signal - `AbortController` signal.
 */
export async function updateRelatedObjectsSelection(
  destructionListItemPk: number,
  mutations: RelatedObjectsSelectionItemMutation[],
  signal?: AbortSignal,
) {
  await request(
    "PATCH",
    `/destruction-list-items/${destructionListItemPk}/related-objects-selection/`,
    undefined,
    mutations,
    undefined,
    signal,
  );
}

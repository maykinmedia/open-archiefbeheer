import { invariant } from "@maykin-ui/client-common";
import { JSX } from "react";

import { RelatedObjectsSelectionModal } from "../../components";
import { Zaak } from "../../types";
import { User } from "../api/auth";
import { DestructionList } from "../api/destructionLists";
import { PaginatedDestructionListItems } from "../api/destructionListsItem";
import { PaginatedResults } from "../api/paginatedResults";

export type DestructionDetailData = Zaak & {
  "Gerelateerde objecten"?: JSX.Element;
  processingStatus?: string;
};

/**
 * Transforms a PaginatedDestructionListItems object into a PaginatedResults object
 * containing DestructionDetailData entries. Filters out items without a valid `zaak`
 * and maps the remaining items to include `zaak` data along with its associated
 * `processingStatus`.
 */
export function paginatedDestructionListItems2DestructionDetailData(
  paginatedDestructionListItems: PaginatedDestructionListItems,
  destructionList: DestructionList,
  user: User,
): PaginatedResults<DestructionDetailData> {
  return {
    ...paginatedDestructionListItems,
    results: paginatedDestructionListItems.results
      .filter((dli) => Boolean(dli.zaak))
      .map((dli) => {
        const zaak = dli.zaak;
        invariant(zaak, "zaak must be a valid Zaak!");

        return {
          ...zaak,
          processingStatus: dli.processingStatus,
          "Gerelateerde objecten": (
            <RelatedObjectsSelectionModal
              amount={zaak.zaakobjecten?.length || 0}
              destructionListItemPk={dli.pk}
              destructionList={destructionList}
              user={user}
            />
          ),
        };
      }),
  };
}

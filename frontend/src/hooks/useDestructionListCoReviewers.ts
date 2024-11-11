import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import {
  DestructionList,
  DestructionListAssignee,
} from "../lib/api/destructionLists";
import { listDestructionListCoReviewers } from "../lib/api/destructionLists";

/**
 * Hook resolving reviewers
 */
export function useDestructionListCoReviewers(
  destructionList: DestructionList,
): DestructionListAssignee[] {
  const alert = useAlert();

  const [coReviewersState, setCoReviewersState] = useState<
    DestructionListAssignee[]
  >([]);
  useEffect(() => {
    listDestructionListCoReviewers(destructionList.uuid)
      .then(
        (r) => setCoReviewersState(r.filter((r) => r.role === "co_reviewer")), // Only list co-reviewers.
      )
      .catch((e) => {
        console.error(e);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van de mede beoordelaars!",
          "Ok",
        );
      });
  }, [destructionList]);

  return coReviewersState;
}

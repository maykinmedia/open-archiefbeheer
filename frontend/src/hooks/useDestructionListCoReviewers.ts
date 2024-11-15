import { useEffect, useState } from "react";

import {
  DestructionList,
  DestructionListAssignee,
} from "../lib/api/destructionLists";
import { listDestructionListCoReviewers } from "../lib/api/destructionLists";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving reviewers
 */
export function useDestructionListCoReviewers(
  destructionList: DestructionList,
): DestructionListAssignee[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de mede beoordelaars!",
  );

  const [coReviewersState, setCoReviewersState] = useState<
    DestructionListAssignee[]
  >([]);
  useEffect(() => {
    listDestructionListCoReviewers(destructionList.uuid)
      .then(
        (r) => setCoReviewersState(r.filter((r) => r.role === "co_reviewer")), // Only list co-reviewers.
      )
      .catch(alertOnError);
  }, [destructionList]);

  return coReviewersState;
}

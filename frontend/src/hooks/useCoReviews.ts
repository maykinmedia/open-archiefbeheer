import { useState } from "react";

import { CoReview, listCoReviews } from "../lib/api/coReview";
import { DestructionList } from "../lib/api/destructionLists";
import { useAlertOnError } from "./useAlertOnError";
import { usePoll } from "./usePoll";

/**
 * Hook resolving co reviews
 */
export function useCoReviews(destructionList?: DestructionList): CoReview[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de mede beoordelingen!",
  );

  const [valueState, setValueState] = useState<CoReview[]>([]);
  usePoll(
    () =>
      listCoReviews({ destructionList__uuid: destructionList?.uuid })
        .then((v) => setValueState(v))
        .catch(alertOnError),
    [destructionList?.uuid],
  );

  return valueState;
}

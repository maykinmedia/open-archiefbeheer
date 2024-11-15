import { useEffect, useState } from "react";

import { User } from "../lib/api/auth";
import { listCoReviewers } from "../lib/api/reviewers";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving reviewers
 */
export function useCoReviewers(): User[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van mede beoordelaars!",
  );

  const [reviewersState, setReviewersState] = useState<User[]>([]);
  useEffect(() => {
    listCoReviewers()
      .then((r) => setReviewersState(r))
      .catch(alertOnError);
  }, []);

  return reviewersState;
}

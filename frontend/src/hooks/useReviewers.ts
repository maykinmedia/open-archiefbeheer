import { useEffect, useState } from "react";

import { User } from "../lib/api/auth";
import { listReviewers } from "../lib/api/reviewers";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving reviewers
 */
export function useReviewers(): User[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van beoordelaars!",
  );

  const [reviewersState, setReviewersState] = useState<User[]>([]);
  useEffect(() => {
    listReviewers()
      .then((r) => setReviewersState(r))
      .catch(alertOnError);
  }, []);

  return reviewersState;
}

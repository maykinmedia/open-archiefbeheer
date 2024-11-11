import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { User } from "../lib/api/auth";
import { listCoReviewers } from "../lib/api/reviewers";

/**
 * Hook resolving reviewers
 */
export function useCoReviewers(): User[] {
  const alert = useAlert();

  const [reviewersState, setReviewersState] = useState<User[]>([]);
  useEffect(() => {
    listCoReviewers()
      .then((r) => setReviewersState(r))
      .catch((e) => {
        console.error(e);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van mede beoordelaars!",
          "Ok",
        );
      });
  }, []);

  return reviewersState;
}

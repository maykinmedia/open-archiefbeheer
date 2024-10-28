import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { User } from "../lib/api/auth";
import { listReviewers } from "../lib/api/reviewers";

/**
 * Hook resolving reviewers
 */
export function useReviewers(): User[] {
  const alert = useAlert();

  const [reviewersState, setReviewersState] = useState<User[]>([]);
  useEffect(() => {
    listReviewers()
      .then((r) => setReviewersState(r))
      .catch((e) => {
        console.error(e);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van beoordelaars!",
          "Ok",
        );
      });
  }, []);

  return reviewersState;
}

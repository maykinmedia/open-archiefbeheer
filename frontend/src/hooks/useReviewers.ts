import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { User } from "../lib/api/auth";
import { listReviewers } from "../lib/api/reviewers";

/**
 * Hook resolving reviewers
 */
export function useReviewers(): User[] {
  const [errorState, setErrorState] = useState<unknown>();
  const alert = useAlert();

  const [reviewersState, setReviewersState] = useState<User[]>([]);
  useEffect(() => {
    listReviewers()
      .then((r) => setReviewersState(r))
      .catch((e) => {
        console.error(errorState);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van beoordelaars!",
          "Ok",
        );
        setErrorState(e);
      });
  }, []);

  return reviewersState;
}

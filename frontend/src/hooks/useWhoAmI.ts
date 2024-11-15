import { useEffect, useState } from "react";

import { User, whoAmI } from "../lib/api/auth";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving the current user
 */
export function useWhoAmI(): User | null {
  const [valueState, setValueState] = useState<ReturnType<
    typeof useWhoAmI
  > | null>(null);
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de huidige gebruiker!",
  );

  useEffect(() => {
    whoAmI()
      .then((value) => setValueState(value))
      .catch(alertOnError);
  }, []);

  return valueState;
}

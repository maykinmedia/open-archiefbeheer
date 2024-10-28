import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { User, whoAmI } from "../lib/api/auth";

/**
 * Hook resolving the current user
 */
export function useWhoAmI(): User | null {
  const alert = useAlert();

  const [valueState, setValueState] = useState<ReturnType<
    typeof useWhoAmI
  > | null>(null);
  useEffect(() => {
    whoAmI()
      .then((value) => setValueState(value))
      .catch((e) => {
        console.error(e);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van de huidige gebruiker!",
          "Ok",
        );
      });
  }, []);

  return valueState;
}

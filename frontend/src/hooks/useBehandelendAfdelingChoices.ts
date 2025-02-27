import { Option } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { listBehandelendAfdelingChoices } from "../lib/api/private";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook to fetch the list of behandelend afdeling choices.
 */
export function useBehandelendAfdelingChoices(): Option[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de resultaattypen!",
  );

  const [valueState, setValueState] = useState<Option[]>([]);
  useEffect(() => {
    console.log("fd");
    listBehandelendAfdelingChoices()
      .then((s) => setValueState(s))
      .catch(alertOnError);
  }, []);

  return valueState;
}

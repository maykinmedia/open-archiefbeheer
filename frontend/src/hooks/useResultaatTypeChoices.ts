import { Option } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { listResultaatTypeChoices } from "../lib/api/private";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving resultaat type choices
 */
export function useResultaatTypeChoices(zaaktypeUrl?: string): Option[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de resultaattypen!",
  );

  const [valueState, setValueState] = useState<Option[]>([]);
  useEffect(() => {
    listResultaatTypeChoices(zaaktypeUrl)
      .then(setValueState)
      .catch(alertOnError);
  }, [zaaktypeUrl]);

  return valueState;
}

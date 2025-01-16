import { Option } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { listStatusTypeChoices } from "../lib/api/private";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving status type choices
 */
export function useStatusTypeChoices(zaaktypeUrl?: string): Option[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de statustypen!",
  );

  const [valueState, setValueState] = useState<Option[]>([]);
  useEffect(() => {
    listStatusTypeChoices(zaaktypeUrl).then(setValueState).catch(alertOnError);
  }, [zaaktypeUrl]);

  return valueState;
}

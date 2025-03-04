import { Option } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { listInternalResultaatTypeChoices } from "../lib/api/private";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook to fetch the internal result type choices.
 */
export function useInternalResultaatTypeChoices(): Option[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de resultaattypen!",
  );

  const [valueState, setValueState] = useState<Option[]>([]);
  useEffect(() => {
    listInternalResultaatTypeChoices()
      .then((s) => setValueState(s))
      .catch(alertOnError);
  }, []);

  return valueState;
}

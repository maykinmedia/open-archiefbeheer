import { Option } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { listInformatieObjectTypeChoices } from "../lib/api/private";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving informatieObject type choices
 */
export function useInformatieObjectTypeChoices(zaaktypeUrl?: string): Option[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de informatie objecttypen!",
  );

  const [valueState, setValueState] = useState<Option[]>([]);
  useEffect(() => {
    listInformatieObjectTypeChoices(zaaktypeUrl)
      .then(setValueState)
      .catch(alertOnError);
  }, [zaaktypeUrl]);

  return valueState;
}

import { Option } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { listSelectielijstKlasseChoices } from "../lib/api/private";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving selectielijst choices
 */
export function useSelectielijstKlasseChoices(): Option[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van selectielijst klassen!",
  );

  const [selectielijstChoicesState, setSelectielijstChoicesState] = useState<
    Option[]
  >([]);
  useEffect(() => {
    listSelectielijstKlasseChoices()
      .then((s) => setSelectielijstChoicesState(s))
      .catch(alertOnError);
  }, []);

  return selectielijstChoicesState;
}

import { Option, useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { listSelectielijstKlasseChoices } from "../../../lib/api/private";

/**
 * Hook resolving selectielijst choices
 */
export function useSelectielijstKlasseChoices(): Option[] {
  const alert = useAlert();

  const [selectielijstChoicesState, setSelectielijstChoicesState] = useState<
    Option[]
  >([]);
  useEffect(() => {
    listSelectielijstKlasseChoices()
      .then((s) => setSelectielijstChoicesState(s))
      .catch((e) => {
        console.error(e);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van selectielijst klassen!",
          "Ok",
        );
      });
  }, []);

  return selectielijstChoicesState;
}

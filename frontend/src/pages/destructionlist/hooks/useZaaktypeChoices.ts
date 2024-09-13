import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { DestructionList } from "../../../lib/api/destructionLists";
import { ZaaktypeChoice, listZaaktypeChoices } from "../../../lib/api/private";
import { Review } from "../../../lib/api/review";

/**
 * Hook resolving zaaktype choices
 * @param destructionList
 * @param review
 */
export function useZaaktypeChoices(
  destructionList?: DestructionList,
  review?: Review,
): ZaaktypeChoice[] {
  const [errorState, setErrorState] = useState<unknown>();
  const alert = useAlert();

  const [zaaktypeChoicesState, setZaaktypeChoicesState] = useState<
    ZaaktypeChoice[]
  >([]);
  useEffect(() => {
    listZaaktypeChoices(destructionList?.uuid, review?.pk)
      .then((z) => setZaaktypeChoicesState(z))
      .catch((e) => setErrorState(e));
  }, [destructionList?.uuid, review?.pk]);

  if (errorState) {
    console.error(errorState);
    alert(
      "Foutmelding",
      "Er is een fout opgetreden bij het ophalen van zaaktypen!",
      "Ok",
    );
  }

  return zaaktypeChoicesState;
}

import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { DestructionList } from "../lib/api/destructionLists";
import { ZaaktypeChoice, listZaaktypeChoices } from "../lib/api/private";
import { Review } from "../lib/api/review";

/**
 * Hook resolving zaaktype choices
 * @param destructionList
 * @param review
 */
export function useZaaktypeChoices(
  destructionList?: DestructionList,
  review?: Review,
  searchParams?: URLSearchParams,
): ZaaktypeChoice[] {
  const alert = useAlert();

  const [zaaktypeChoicesState, setZaaktypeChoicesState] = useState<
    ZaaktypeChoice[]
  >([]);
  useEffect(() => {
    listZaaktypeChoices(destructionList?.uuid, review?.pk, searchParams)
      .then((z) => setZaaktypeChoicesState(z))
      .catch((e) => {
        console.error(e);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van zaaktypen!",
          "Ok",
        );
      });
  }, [destructionList?.uuid, review?.pk, searchParams?.toString()]);

  return zaaktypeChoicesState;
}

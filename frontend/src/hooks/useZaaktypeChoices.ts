import { useEffect, useState } from "react";

import { DestructionList } from "../lib/api/destructionLists";
import { ZaaktypeChoice, listZaaktypeChoices } from "../lib/api/private";
import { Review } from "../lib/api/review";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving zaaktype choices
 * @param destructionList
 * @param review
 * @param searchParams
 */
export function useZaaktypeChoices(
  destructionList?: DestructionList,
  review?: Review,
  searchParams?: URLSearchParams,
): ZaaktypeChoice[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van zaaktypen!",
  );

  const [zaaktypeChoicesState, setZaaktypeChoicesState] = useState<
    ZaaktypeChoice[]
  >([]);
  useEffect(() => {
    listZaaktypeChoices(destructionList?.uuid, review?.pk, searchParams)
      .then((z) => setZaaktypeChoicesState(z))
      .catch(alertOnError);
  }, [destructionList?.uuid, review?.pk, searchParams?.toString()]);

  return zaaktypeChoicesState;
}

import { Option } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { DestructionList } from "../lib/api/destructionLists";
import { listZaaktypeChoices } from "../lib/api/private";
import { Review } from "../lib/api/review";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving zaaktype choices
 * @param destructionList
 * @param review
 * @param searchParams
 * @param external
 */
export function useZaaktypeChoices(
  destructionList?: DestructionList,
  review?: Review,
  searchParams?: URLSearchParams,
  external = false,
): Option[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van zaaktypen!",
  );

  const [zaaktypeChoicesState, setZaaktypeChoicesState] = useState<Option[]>(
    [],
  );
  useEffect(() => {
    listZaaktypeChoices(
      destructionList?.uuid,
      review?.pk,
      searchParams,
      external,
    )
      .then((z) => setZaaktypeChoicesState(z))
      .catch(alertOnError);
  }, [destructionList?.uuid, review?.pk, searchParams?.toString()]);

  return zaaktypeChoicesState;
}

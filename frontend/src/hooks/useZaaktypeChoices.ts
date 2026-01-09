import { Option } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { listZaaktypeChoices } from "../lib/api/private";
import { params2CacheKey } from "../lib/format/params";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving zaaktype choices
 * @param params
 * @param external
 * @param initalData
 */
export function useZaaktypeChoices<T = Option[]>(
  params?: Parameters<typeof listZaaktypeChoices>[0],
  external = false,
  initalData?: T,
): T | Option[] {
  const initial = typeof initalData === "undefined" ? [] : initalData;
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van zaaktypen!",
  );

  const [zaaktypeChoicesState, setZaaktypeChoicesState] = useState<
    T | Option[]
  >(initial);

  useEffect(() => {
    setZaaktypeChoicesState(initial);
    const abortController = new AbortController();

    listZaaktypeChoices(params, abortController.signal)
      .then((z) => setZaaktypeChoicesState(z))
      .catch(alertOnError);

    return () => abortController.abort();
  }, [params2CacheKey(params || {}), external]);

  return zaaktypeChoicesState;
}

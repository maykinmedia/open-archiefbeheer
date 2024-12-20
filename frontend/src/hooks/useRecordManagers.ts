import { useEffect, useState } from "react";

import { User } from "../lib/api/auth";
import { listRecordManagers } from "../lib/api/recordManagers";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving recordManagers
 */
export function useRecordManagers(): User[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van record managers!",
  );

  const [recordManagersState, setRecordManagersState] = useState<User[]>([]);
  useEffect(() => {
    listRecordManagers()
      .then((r) => setRecordManagersState(r))
      .catch(alertOnError);
  }, []);

  return recordManagersState;
}

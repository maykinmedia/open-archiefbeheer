import { useEffect, useState } from "react";

import { AuditLogItem, listAuditLog } from "../lib/api/auditLog";
import { DestructionList } from "../lib/api/destructionLists";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving audit log items with an optional event filter.
 */
export function useAuditLog(
  destructionList?: DestructionList,
  event?: string,
): AuditLogItem[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de audit log!",
  );

  const [auditLogState, setAuditLogState] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    if (!destructionList) {
      setAuditLogState([]);
      return;
    }

    listAuditLog(destructionList.uuid, event)
      .then((logItems) => setAuditLogState(logItems))
      .catch(alertOnError);
  }, [destructionList?.uuid, event]);

  return auditLogState;
}

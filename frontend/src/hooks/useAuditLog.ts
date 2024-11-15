import { useEffect, useState } from "react";

import { AuditLogItem, listAuditLog } from "../lib/api/auditLog";
import { DestructionList } from "../lib/api/destructionLists";
import { useAlertOnError } from "./useAlertOnError";

/**
 * Hook resolving audit log items
 */
export function useAuditLog(destructionList?: DestructionList): AuditLogItem[] {
  const alertOnError = useAlertOnError(
    "Er is een fout opgetreden bij het ophalen van de audit log!",
  );

  const [auditLogState, setAuditLogState] = useState<AuditLogItem[]>([]);
  useEffect(() => {
    if (!destructionList) {
      setAuditLogState([]);
      return;
    }

    listAuditLog(destructionList.uuid)
      .then((a) => setAuditLogState(a))
      .catch(alertOnError);
  }, [destructionList?.uuid]);

  return auditLogState;
}

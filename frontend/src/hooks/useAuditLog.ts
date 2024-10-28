import { useAlert } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { AuditLogItem, listAuditLog } from "../lib/api/auditLog";
import { DestructionList } from "../lib/api/destructionLists";

/**
 * Hook resolving audit log items
 */
export function useAuditLog(destructionList?: DestructionList): AuditLogItem[] {
  const alert = useAlert();

  const [auditLogState, setAuditLogState] = useState<AuditLogItem[]>([]);
  useEffect(() => {
    if (!destructionList) {
      setAuditLogState([]);
      return;
    }

    listAuditLog(destructionList.uuid)
      .then((a) => setAuditLogState(a))
      .catch((e) => {
        console.error(e);
        alert(
          "Foutmelding",
          "Er is een fout opgetreden bij het ophalen van de audit log!",
          "Ok",
        );
      });
  }, [destructionList?.uuid]);

  return auditLogState;
}

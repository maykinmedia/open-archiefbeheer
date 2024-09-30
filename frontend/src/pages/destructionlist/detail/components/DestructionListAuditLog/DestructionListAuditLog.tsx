import { DataGrid } from "@maykin-ui/admin-ui";
import { useLoaderData } from "react-router-dom";

import { AuditLogItem } from "../../../../../lib/api/auditLog";
import { formatDate } from "../../../../../lib/format/date";
import { formatUser } from "../../../../../lib/format/user";
import { DestructionListDetailContext } from "../../DestructionListDetail.loader";

/**
 * Toolbar on top of destruction list page providing meta information.
 * @constructor
 */
export function DestructionListAuditLog() {
  const { logItems } = useLoaderData() as DestructionListDetailContext;

  const objectList = logItems.map((logItem) => ({
    Datum: formatDate(logItem.timestamp),
    "Gewijzigd door": formatUser(logItem.user),
    Wijziging: logItem.message,
  }));

  return <DataGrid objectList={objectList} sort={true} />;
}

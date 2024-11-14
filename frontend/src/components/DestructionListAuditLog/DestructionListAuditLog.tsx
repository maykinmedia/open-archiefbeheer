import { DataGrid } from "@maykin-ui/admin-ui";

import { useAuditLog } from "../../hooks";
import { DestructionList } from "../../lib/api/destructionLists";
import { formatDateAndTime } from "../../lib/format/date";
import { formatUser } from "../../lib/format/user";

/**
 * Shows the destruction list's audit log (if passed).
 */
export function DestructionListAuditLog({
  destructionList,
}: {
  destructionList?: DestructionList;
}) {
  const logItems = useAuditLog(destructionList);

  const objectList = logItems.map((logItem) => ({
    Datum: formatDateAndTime(logItem.timestamp),
    "Gewijzigd door": formatUser(logItem.user),
    Wijziging: logItem.message,
  }));

  return <DataGrid objectList={objectList} sort={true} />;
}

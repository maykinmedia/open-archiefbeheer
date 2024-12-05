import { AttributeTable, DataGrid } from "@maykin-ui/admin-ui";

import { useAuditLog } from "../../hooks";
import { AuditLogItem } from "../../lib/api/auditLog";
import { DestructionList } from "../../lib/api/destructionLists";
import { formatDateAndTime } from "../../lib/format/date";
import { formatUser } from "../../lib/format/user";

export function DestructionListAuditLogHistory({
  logItems,
}: {
  logItems: AuditLogItem[];
}) {
  const historyObjectList = logItems.map((logItem) => ({
    Datum: formatDateAndTime(logItem.timestamp),
    "Gewijzigd door": formatUser(logItem.user),
    Wijziging: logItem.message,
  }));

  return <DataGrid objectList={historyObjectList} sort={true} />;
}

export function DestructionListAuditLogDetails({
  destructionList,
}: {
  destructionList?: DestructionList;
}) {
  const logItemsReadyForFirstReview = useAuditLog(
    destructionList,
    "destruction_list_ready_for_first_review",
  );
  const readyForFirstReviewLogItem =
    logItemsReadyForFirstReview.length > 0
      ? logItemsReadyForFirstReview[0]
      : null;

  if (!readyForFirstReviewLogItem) {
    return null;
  }

  const extraData = readyForFirstReviewLogItem.extraData;
  const detailsObjectList = {
    Auteur: formatUser(readyForFirstReviewLogItem.user),
    ...(extraData && {
      "Min/Max archiefactiedatum": `van ${
        extraData.minArchiefactiedatum &&
        formatDateAndTime(extraData.minArchiefactiedatum)
      } tot ${extraData.maxArchiefactiedatum && formatDateAndTime(extraData.maxArchiefactiedatum)}`,
      Zaaktypen: extraData.zaaktypen
        ?.map((zaaktype) => zaaktype.label)
        .join(", "),
      Resultaten: extraData.resultaten
        ?.map((resultaat) => resultaat.label)
        .join(", "),
      Archiefnominaties: extraData.archiefnominaties?.join(", "),
      Comment: extraData.comment,
      "Hoeveelheid Zaken": extraData.numberOfZaken,
    }),
  };

  return <AttributeTable object={detailsObjectList} />;
}

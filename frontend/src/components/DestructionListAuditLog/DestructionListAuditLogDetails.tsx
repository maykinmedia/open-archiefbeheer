import { AttributeTable } from "@maykin-ui/admin-ui";

import { AuditLogItem } from "../../lib/api/auditLog";
import { formatDateAndTime } from "../../lib/format/date";
import { formatUser } from "../../lib/format/user";

export function DestructionListAuditLogDetails({
  readyForFirstReviewLogItem,
}: {
  readyForFirstReviewLogItem: AuditLogItem;
}) {
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

import { DataGrid, sortDataArray } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { AuditLogItem } from "../../lib/api/auditLog";
import { formatDateAndTime } from "../../lib/format/date";
import { formatUser } from "../../lib/format/user";

type DestructionListAuditLogHistoryItem = {
  Datum: string;
  "Gewijzigd door": string;
  Wijziging: string;
};

export function DestructionListAuditLogHistory({
  logItems,
}: {
  logItems: AuditLogItem[];
}) {
  const [objectList, setObjectList] = useState<
    DestructionListAuditLogHistoryItem[]
  >([]);

  useEffect(() => {
    const data: DestructionListAuditLogHistoryItem[] = logItems.map(
      (logItem) => ({
        Datum: formatDateAndTime(logItem.timestamp),
        "Gewijzigd door": formatUser(logItem.user),
        Wijziging: logItem.message,
      }),
    );
    setObjectList(data);
  }, [logItems]);

  /**
   * Returns the sorted `objectList`.
   * @param sort
   */
  const handleSort = (sort: string) => {
    const order = sort.startsWith("-") ? "DESC" : "ASC";
    const key = sort.replace("-", "") as keyof (typeof objectList)[number];

    if (key === "Datum") {
      const result = objectList.sort((a, b) => {
        const [dateStrA, timeStrA] = a.Datum.split(" ");
        const [dataStrB, timeStrB] = b.Datum.split(" ");

        const isoA = dateStrA.split("/").reverse().join("-") + " " + timeStrA;
        const isoB = dataStrB.split("/").reverse().join("-") + " " + timeStrB;

        const dateA = new Date(isoA);
        const dateB = new Date(isoB);

        if (order === "DESC") {
          return dateA > dateB ? -1 : 1;
        } else {
          return dateA < dateB ? -1 : 1;
        }
      });
      setObjectList(result);
    } else {
      setObjectList(sortDataArray(objectList, key, order));
    }
  };

  return <DataGrid objectList={objectList} sort={true} onSort={handleSort} />;
}

import { DataGrid, TypedField, sortDataArray } from "@maykin-ui/admin-ui";
import { useEffect, useState } from "react";

import { AuditLogItem } from "../../lib/api/auditLog";
import { formatDateAndTime } from "../../lib/format/date";
import { formatGroups, formatUser } from "../../lib/format/user";
import { ExpandableText } from "../ExpandableText";

type DestructionListAuditLogHistoryItem = {
  Datum: string;
  "Gewijzigd door": string;
  Rol: string;
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

  const overflowRowData = (fieldName: string, text: string) => {
    return <ExpandableText text={text} fieldName={fieldName} />;
  };

  const fields: TypedField<DestructionListAuditLogHistoryItem>[] = [
    {
      name: "Datum",
      type: "string",
      width: "150px",
    },
    {
      name: "Gewijzigd door",
      type: "string",
      width: "250px",
      valueTransform: (rd) =>
        overflowRowData("gewijzigdDoorOverflowButton", rd["Gewijzigd door"]),
    },
    {
      name: "Rol",
      type: "string",
      width: "250px",
      valueTransform: (rd) => overflowRowData("rolOverflowButton", rd.Rol),
    },
    {
      name: "Wijziging",
      type: "string",
      valueTransform: (rd) =>
        overflowRowData("wijzigingOverflowButton", rd.Wijziging),
    },
  ];

  useEffect(() => {
    const data: DestructionListAuditLogHistoryItem[] = logItems.map(
      (logItem) => ({
        Datum: formatDateAndTime(logItem.timestamp),
        "Gewijzigd door": formatUser(logItem.user),
        Rol: formatGroups(logItem.extraData?.userGroups),
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

  return (
    <DataGrid
      fields={fields}
      objectList={objectList}
      sort={true}
      onSort={handleSort}
      tableLayout="fixed"
    />
  );
}

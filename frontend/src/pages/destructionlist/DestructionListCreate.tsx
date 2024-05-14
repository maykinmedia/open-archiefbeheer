import {
  AttributeData,
  DataGridProps,
  List,
  TypedField,
} from "@maykin-ui/admin-ui";
import React from "react";
import { useLoaderData } from "react-router-dom";

import { loginRequired } from "../../lib/api/loginRequired";
import { PaginatedZaken, listZaken } from "../../lib/api/zaken";
import { Zaak } from "../../types";
import "./DestructionListCreate.css";

/**
 * React Router loader.
 * @param request
 * TOOD: Requires destruction list lists endpoint.
 */
export const destructionListCreateLoader = loginRequired(listZaken);

export type DestructionListCreateProps = Omit<
  React.ComponentProps<"main">,
  "onChange" | "onSelect"
>;

/**
 * Destruction list creation page
 */
export function DestructionListCreatePage({
  ...props
}: DestructionListCreateProps) {
  const { count, results } = useLoaderData() as PaginatedZaken;
  const objectList = transformZakenForPresentation(results);

  console.log(results, objectList);

  const fields: TypedField[] = [
    { name: "identificatie", type: "string" },
    { name: "zaaktype", type: "string" },
    { name: "omschrijving", type: "string" },
    { name: "looptijd", type: "string" },
    { name: "resultaattype", type: "string" },
    { name: "bewaartermijn", type: "string" },
    { name: "vcs", type: "string" },
    { name: "relaties", type: "boolean" },
  ];

  return (
    <List
      count={count}
      fields={fields}
      objectList={objectList}
      labelSelect={"Selecteer item"} // FIXME: optional
      labelSelectAll={"Selecteer alle items"} // FIXME: optional
      pageSize={10}
      showPaginator={false} // TODO
      selectable={false} // TODO
      dataGridProps={
        // FIXME: Required attrs, alias
        {
          boolProps: {
            explicit: true,
            labelFalse: "Nee", // FIXME: optional
          },
          filterable: true,
        } as DataGridProps
      }
      title="Vernietigingslijst starten"
      {...props}
    />
  );
}

export function transformZakenForPresentation(zaken: Zaak[]) {
  return zaken.map<AttributeData>((zaak) => {
    const startDate = new Date(zaak.startdatum);
    const endDate = zaak.einddatum ? new Date(zaak.einddatum) : new Date();
    const dayDelta =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    return {
      identificatie: zaak.identificatie || "",
      zaaktype: zaak.zaaktype,
      omschrijving: zaak.omschrijving || "",
      looptijd: String(dayDelta),
      resultaattype: "TODO",
      bewaartermijn: "TODO",
      vcs: "TODO",
      relaties: Boolean(zaak?.relevanteAndereZaken?.length || 0),
    };
  });
}
